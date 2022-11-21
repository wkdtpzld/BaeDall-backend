import { Injectable } from '@nestjs/common';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';

import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/categories.repository';
import { Category } from './entities/category.entity';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto.';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { ILike } from 'typeorm';
import { DishRepository } from '../dish/repository/dishes-repository';

@Injectable()
export class RestaurantService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly categories: CategoryRepository,
    private readonly dishes: DishRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.restaurants.create(
        createRestaurantInput,
      );
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create restaurant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const IsMatch = await this.restaurants.IsMatchOwner(
        owner,
        editRestaurantInput.restaurantId,
      );
      if (IsMatch) return IsMatch;
      let category: Category = null;

      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }

      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not edit Restaurant',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const IsNotOwenr = await this.restaurants.IsMatchOwner(
        owner,
        deleteRestaurantInput.restaurantId,
      );
      if (IsNotOwenr) return IsNotOwenr;
      await this.restaurants.delete(deleteRestaurantInput.restaurantId);

      return {
        ok: true,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could Not Delete Restaurant',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could not load Categories',
      };
    }
  }

  async countRestaurant(category: Category): Promise<number> {
    return await this.restaurants.count({
      where: { category: { id: category.id } },
    });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({
        where: { slug },
        relations: ['restaurants'],
      });
      if (!category) {
        return {
          ok: false,
          error: 'Category not found',
        };
      }
      const restaurants = await this.restaurants.find({
        where: {
          category: { id: category.id },
        },
        take: 20,
        skip: (page - 1) * 25,
      });
      category.restaurants = restaurants;
      const totalResults = await this.countRestaurant(category);
      return {
        ok: true,
        category,
        totalPage: Math.ceil(totalResults / 20),
        totalItems: totalResults,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could Not find Category Because occured Error',
      };
    }
  }

  async allRestaurant({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 20,
        take: 20,
      });

      return {
        ok: true,
        restaurants,
        totalPage: Math.ceil(totalResults / 20),
        totalItems: totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load restaurants',
      };
    }
  }

  async findRestaurantById(
    restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantInput.restaurantId },
        relations: ['menu'],
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant Not Found',
        };
      }

      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not Find Restaurant',
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: { name: ILike(`%${query}%`) },
        skip: (page - 1) * 20,
        take: 20,
      });

      return {
        ok: true,
        restaurants,
        totalItems: totalResults,
        totalPage: Math.ceil(totalResults / 20),
      };
    } catch (e) {
      return { ok: false, error: 'Could not Search Restaurant' };
    }
  }
}
