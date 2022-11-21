import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/categories.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { DishRepository } from '../dish/repository/dishes-repository';
import { Dish } from 'src/dish/entites/dish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantResolver,
    RestaurantService,
    CategoryRepository,
    RestaurantRepository,
    CategoryResolver,
    DishRepository,
  ],
})
export class RestaurantsModule {}
