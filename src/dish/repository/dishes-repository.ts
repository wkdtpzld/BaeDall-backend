import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Dish } from '../entites/dish.entity';

@Injectable()
export class DishRepository extends Repository<Dish> {
  constructor(private dataSource: DataSource) {
    super(Dish, dataSource.createEntityManager());
  }
}
