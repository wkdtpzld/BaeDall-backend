import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';
import { CategoryRepository } from '../restaurants/repositories/categories.repository';
import { Injectable } from '@nestjs/common';
import { DishRepository } from './repository/dishes-repository';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { User } from 'src/users/entities/user.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { Dish } from './entites/dish.entity';

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
      const dish = await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      console.log(dish);

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
      const dish = await this.dishes.findOne({
        where: { id: editDishInput.dishId },
        relations: ['restaurant'],
      });
      const IsNotMatchOnwer = this.IsOnwerCheck(dish, owner);
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
        error: 'Could not DeleteDish',
      };
    }
  }

  async deleteDish(
    owner: User,
    deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne({
        where: { id: deleteDishInput.dishId },
        relations: ['restaurant'],
      });
      const IsNotMatchOnwer = this.IsOnwerCheck(dish, owner);
      if (IsNotMatchOnwer) return IsNotMatchOnwer;

      await this.dishes.delete(dish.id);
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

  IsOnwerCheck(dish: Dish, owner: User) {
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
