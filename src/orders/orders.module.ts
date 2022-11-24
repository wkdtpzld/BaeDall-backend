import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersResolver } from './orders.resolver';
import { OrderRepository } from './repository/order.repository';
import { OrdersService } from './orders.service';
import { OrderItemRepository } from './repository/orderItem.repository';
import { OrderItem } from './entities/order-item.entity';
import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Dish } from 'src/dish/entites/dish.entity';
import { DishRepository } from 'src/dish/repository/dishes-repository';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Restaurant, Dish])],
  providers: [
    OrderRepository,
    OrderItemRepository,
    OrdersResolver,
    OrdersService,
    RestaurantRepository,
    DishRepository,
  ],
})
export class OrdersModule {}
