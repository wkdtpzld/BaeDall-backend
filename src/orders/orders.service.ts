import { Injectable } from '@nestjs/common';
import { OrderRepository } from './repository/order.repository';
import { OrderItemRepository } from './repository/orderItem.repository';
import { CreateOrderInput, CreateOrderOutput } from './dtos/createOrder.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';
import { DishRepository } from 'src/dish/repository/dishes-repository';
import { OrderItem } from './entities/order-item.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order, OrderStatus } from './entities/order.entity';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly orderItems: OrderItemRepository,
    private readonly restaurants: RestaurantRepository,
    private readonly dishes: DishRepository,
  ) {}

  async createOrder(
    customer: User,
    createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createOrderInput.restaurantId },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant Not Found',
        };
      }
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of createOrderInput.items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          return {
            ok: false,
            error: 'Dish Not Found',
          };
        }
        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choices,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({ dish, options: item.options }),
        );
        orderItems.push(orderItem);
      }
      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not CreateOrder',
      };
    }
  }

  async getOrders(
    user: User,
    { status, page }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: { id: user.id },
            ...(status && { status }),
          },
          take: 20,
          skip: (page - 1) * 25,
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: { id: user.id },
            ...(status && { status }),
          },
          take: 20,
          skip: (page - 1) * 25,
        });
      } else if (user.role === UserRole.Owner) {
        const restaurant = await this.restaurants.find({
          where: {
            owner: { id: user.id },
          },
          relations: ['orders'],
        });
        orders = restaurant.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }

      return {
        ok: false,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: 'Could return orders',
      };
    }
  }

  async getOrder(
    user: User,
    getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    const order = await this.orders.findOne({
      where: { id: getOrderInput.id },
      relations: ['restaurant', 'items'],
    });

    if (!order) {
      return {
        ok: false,
        error: 'Order Not Found',
      };
    }

    let canSee = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }
    if (!canSee) {
      return {
        ok: false,
        error: 'You Can`t See that',
      };
    }
  }

  async editOrder(
    user: User,
    editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id: editOrderInput.id },
        relations: ['restaurant'],
      });

      if (!order) {
        return {
          ok: false,
          error: 'Order Not Found',
        };
      }

      let canSee = true;
      if (user.role === UserRole.Client && order.customerId !== user.id) {
        canSee = false;
      }
      if (user.role === UserRole.Delivery && order.driverId !== user.id) {
        canSee = false;
      }
      if (
        user.role === UserRole.Owner &&
        order.restaurant.ownerId !== user.id
      ) {
        canSee = false;
      }
      if (!canSee) {
        return {
          ok: false,
          error: 'You Can`t See that',
        };
      }

      let canEdit = true;

      if (user.role === UserRole.Client) {
        canEdit = false;
      }

      if (user.role === UserRole.Owner) {
        if (
          editOrderInput.status !== OrderStatus.Cooking &&
          editOrderInput.status !== OrderStatus.Cooked
        ) {
          canEdit = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (
          editOrderInput.status !== OrderStatus.Picked &&
          editOrderInput.status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }

      if (!canEdit) {
        return {
          ok: false,
          error: 'You Can`t do that',
        };
      }

      await this.orders.save([
        { id: editOrderInput.id, status: editOrderInput.status },
      ]);

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not EditOrder',
      };
    }
  }
}
