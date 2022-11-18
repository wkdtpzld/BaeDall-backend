import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class RestaurantRepository extends Repository<Restaurant> {
  constructor(private dataSource: DataSource) {
    super(Restaurant, dataSource.createEntityManager());
  }

  async IsMatchOwner(owner: User, restaurantId: number): Promise<CoreOutput> {
    const restaurant = await this.findOneOrFail({
      where: { id: restaurantId },
      loadRelationIds: true,
    });
    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    if (owner.id !== restaurant.ownerId) {
      return { ok: false, error: 'Not Match OwnerId' };
    }
  }
}
