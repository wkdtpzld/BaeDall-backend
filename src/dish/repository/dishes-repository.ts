import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Dish } from '../entites/dish.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class DishRepository extends Repository<Dish> {
  constructor(private dataSource: DataSource) {
    super(Dish, dataSource.createEntityManager());
  }

  async findOneOrThrow(owner: User, dishId: number) {
    const dish = await this.findOne({
      where: { id: dishId },
      relations: ['restaurant'],
    });

    if (!dish) {
      return {
        ok: false,
        error: 'Dish Not Found',
      };
    }

    if (dish.restaurant.ownerId !== owner.id) {
      return {
        ok: false,
        error: 'You can`t do that',
      };
    }
  }
}
