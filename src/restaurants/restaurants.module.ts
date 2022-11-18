import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryResolver, RestaurantResolver } from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/categories.repository';
import { RestaurantRepository } from './repositories/restaurant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [
    RestaurantResolver,
    RestaurantService,
    CategoryRepository,
    RestaurantRepository,
    CategoryResolver,
  ],
})
export class RestaurantsModule {}
