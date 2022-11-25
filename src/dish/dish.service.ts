import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';
import { Injectable } from '@nestjs/common';
import { DishRepository } from './repository/dishes-repository';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { User } from 'src/users/entities/user.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Injectable()
export class DishService {
  constructor(
    private readonly dishes: DishRepository,
    private readonly restaurants: RestaurantRepository,
  ) {}

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: createDishInput.restaurantId },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant Not Found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'You Can`t do that',
        };
      }
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not Create Dish',
      };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const IsNotMatchOnwer = await this.dishes.findOneOrThrow(
        owner,
        editDishInput.dishId,
      );

      if (IsNotMatchOnwer) return IsNotMatchOnwer;

      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not EditDish',
      };
    }
  }

  async deleteDish(
    owner: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const IsMatch = await this.dishes.findOneOrThrow(
        owner,
        deleteDishInput.dishId,
      );

      if (IsMatch) return IsMatch;

      await this.dishes.delete(deleteDishInput.dishId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not DeleteDish',
      };
    }
  }
}
