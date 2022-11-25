import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DishService } from 'src/dish/dish.service';
import { DishRepository } from 'src/dish/repository/dishes-repository';
import { RestaurantRepository } from 'src/restaurants/repositories/restaurant.repository';
import { User, UserRole } from 'src/users/entities/user.entity';
import { OrdersService } from './orders.service';
import { OrderRepository } from './repository/order.repository';
import { OrderItemRepository } from './repository/orderItem.repository';
import { CreateOrderInput } from './dtos/createOrder.dto';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
  findOneOrThrow: jest.fn(),
});

const userArgs: User = {
  id: 1,
  email: 'slwhswk9@gmail.com',
  role: UserRole.Client,
  password: '12345',
  refreshToken: 'refreshToken',
  checkPassword: jest.fn(),
  createdAt: new Date(),
  updatedAt: new Date(),
  hashPassword: jest.fn(),
  verified: true,
  restaurants: null,
  orders: null,
  rides: null,
};

describe('dishService', () => {
  let service: OrdersService;
  let restaurantRepository: Partial<
    Record<keyof RestaurantRepository, jest.Mock>
  >;
  let dishRepository: Partial<Record<keyof DishRepository, jest.Mock>>;
  let orderRepository: Partial<Record<keyof OrderRepository, jest.Mock>>;
  let orderItemRepository: Partial<
    Record<keyof OrderItemRepository, jest.Mock>
  >;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(RestaurantRepository),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(DishRepository),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(OrderItemRepository),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(OrderRepository),
          useValue: mockRepository(),
        },
      ],
    }).compile();
    service = module.get<OrdersService>(OrdersService);
    restaurantRepository = module.get(getRepositoryToken(RestaurantRepository));
    dishRepository = module.get(getRepositoryToken(DishRepository));
    orderRepository = module.get(getRepositoryToken(OrderRepository));
    orderItemRepository = module.get(getRepositoryToken(OrderItemRepository));
  });

  it('to be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    const createOrderInput: CreateOrderInput = {
      restaurantId: 1,
      items: [
        {
          dishId: 1,
          options: [
            { name: '1', choices: '1' },
            { name: '2', choices: '2' },
          ],
        },
      ],
    };

    it('should return createOrder', async () => {
      restaurantRepository.findOne.mockReturnValue({ id: 1 });
      dishRepository.findOne.mockResolvedValue({
        id: 1,
        price: 1,
        options: [
          {
            name: '1',
            choices: [
              {
                name: '1',
                extra: 2,
              },
            ],
          },
          {
            name: '2',
            chices: [
              {
                name: '2',
              },
            ],
            extra: 2,
          },
        ],
      });
      const result = await service.createOrder(userArgs, createOrderInput);

      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findOne).toHaveBeenCalledWith({
        where: { id: createOrderInput.restaurantId },
      });

      expect(dishRepository.findOne).toHaveBeenCalledTimes(1);
      expect(dishRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(orderItemRepository.save).toHaveBeenCalledTimes(1);
      expect(orderItemRepository.create).toHaveBeenCalledTimes(1);
      expect(orderItemRepository.create).toHaveBeenCalledWith(
        expect.any(Object),
      );

      expect(orderRepository.save).toHaveBeenCalledTimes(1);
      expect(orderRepository.create).toHaveBeenCalledTimes(1);
      expect(orderRepository.create).toHaveBeenCalledWith({
        customer: userArgs,
        restaurant: { id: 1 },
        total: 5,
        items: [],
      });

      expect(result).toEqual({ ok: true });
    });

    it('should failed not found restaurant', async () => {
      restaurantRepository.findOne.mockReturnValue(null);
      const result = await service.createOrder(userArgs, createOrderInput);

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant Not Found',
      });
    });

    it('should failed not found dish', async () => {
      restaurantRepository.findOne.mockReturnValue({ id: 1 });
      dishRepository.findOne.mockResolvedValue(null);
      const result = await service.createOrder(userArgs, createOrderInput);

      expect(result).toEqual({
        ok: false,
        error: 'Dish Not Found',
      });
    });

    it('should failed server error', async () => {
      restaurantRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createOrder(userArgs, createOrderInput);

      expect(result).toEqual({
        ok: false,
        error: 'Could not CreateOrder',
      });
    });
  });
});
