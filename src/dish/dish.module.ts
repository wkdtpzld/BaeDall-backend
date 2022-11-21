import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DishResolver } from './dish.resolver';
import { DishService } from './dish.service';
import { Dish } from './entites/dish.entity';
import { DishRepository } from './repository/dishes-repository';
import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Dish])],
  providers: [DishResolver, DishRepository, DishService, RestaurantRepository],
})
export class DishModule {}
