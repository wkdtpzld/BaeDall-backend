import { DishService } from './dish.service';
import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';
import { DishRepository } from './repository/dishes-repository';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateDishInput } from './dtos/create-dish.dto';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
  findOneOrThrow: jest.fn(),
});

const userArgs: User = {
  id: 1,
  email: 'slwhswk9@gmail.com',
  role: UserRole.Client,
  password: '12345',
  refreshToken: 'refreshToken',
  checkPassword: jest.fn(),
  createdAt: new Date(),
  updatedAt: new Date(),
  hashPassword: jest.fn(),
  verified: true,
  restaurants: null,
  orders: null,
  rides: null,
};

describe('dishService', () => {
  let service: DishService;
  let restaurantRepository: Partial<
    Record<keyof RestaurantRepository, jest.Mock>
  >;
  let dishRepository: Partial<Record<keyof DishRepository, jest.Mock>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DishService,
        {
          provide: getRepositoryToken(RestaurantRepository),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(DishRepository),
          useValue: mockRepository(),
        },
      ],
    }).compile();
    service = module.get<DishService>(DishService);
    restaurantRepository = module.get(getRepositoryToken(RestaurantRepository));
    dishRepository = module.get(getRepositoryToken(DishRepository));
  });

  it('to be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDish', () => {
    const createDishInput: CreateDishInput = {
      restaurantId: 1,
      name: 'name',
      description: 'descriotion',
      price: 10,
      options: null,
    };

    it('should return success createDish', async () => {
      const restaurantArgs = { id: 1, ownerId: 1 };
      restaurantRepository.findOne.mockResolvedValue(restaurantArgs);
      const result = await service.createDish(userArgs, createDishInput);

      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDishInput.restaurantId },
      });

      expect(dishRepository.save).toHaveBeenCalledTimes(1);
      expect(dishRepository.create).toHaveBeenCalledTimes(1);
      expect(dishRepository.create).toHaveBeenCalledWith({
        ...createDishInput,
        restaurant: restaurantArgs,
      });

      expect(result).toEqual({ ok: true });
    });

    it('should return not found restaurant', async () => {
      restaurantRepository.findOne.mockResolvedValue(null);
      const result = await service.createDish(userArgs, createDishInput);

      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDishInput.restaurantId },
      });

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant Not Found',
      });
    });

    it('should return not match owner', async () => {
      const restaurantArgs = { id: 1, ownerId: 2 };
      restaurantRepository.findOne.mockResolvedValue(restaurantArgs);
      const result = await service.createDish(userArgs, createDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'You Can`t do that',
      });
    });

    it('should return failed server Error', async () => {
      restaurantRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createDish(userArgs, createDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Could not Create Dish',
      });
    });
  });
  describe('editDish', () => {
    const editDishInput = { dishId: 1, name: 'name' };
    it('should return success editDish', async () => {
      dishRepository.findOne.mockResolvedValue({ id: 1 });
      const result = await service.editDish(userArgs, editDishInput);

      expect(dishRepository.findOneOrThrow).toHaveBeenCalledTimes(1);
      expect(dishRepository.findOneOrThrow).toHaveBeenCalledWith(
        userArgs,
        editDishInput.dishId,
      );

      expect(dishRepository.save).toHaveBeenCalledTimes(1);
      expect(dishRepository.save).toHaveBeenCalledWith([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);

      expect(result).toEqual({
        ok: true,
      });
    });
    it('should return failed not found dish', async () => {
      dishRepository.findOneOrThrow.mockResolvedValue({
        ok: false,
        error: 'Dish Not Found',
      });
      const result = await service.editDish(userArgs, editDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Dish Not Found',
      });
    });
    it('should return failed not match owner', async () => {
      dishRepository.findOneOrThrow.mockResolvedValue({
        ok: false,
        error: 'You can`t do that',
      });
      const result = await service.editDish(userArgs, editDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'You can`t do that',
      });
    });
    it('should return failed server error', async () => {
      dishRepository.findOneOrThrow.mockRejectedValue(new Error());
      const result = await service.editDish(userArgs, editDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Could not EditDish',
      });
    });
  });
  describe('deleteDish', () => {
    const deleteDishInput = { dishId: 1 };

    it('should return deleteDish', async () => {
      dishRepository.findOneOrThrow.mockResolvedValue(null);
      const result = await service.deleteDish(userArgs, deleteDishInput);

      expect(dishRepository.delete).toHaveBeenCalledTimes(1);
      expect(dishRepository.delete).toHaveBeenCalledWith(
        deleteDishInput.dishId,
      );

      expect(dishRepository.findOneOrThrow).toHaveBeenCalledTimes(1);
      expect(dishRepository.findOneOrThrow).toHaveBeenCalledWith(
        userArgs,
        deleteDishInput.dishId,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should return failed not found', async () => {
      dishRepository.findOneOrThrow.mockResolvedValue({
        ok: false,
        error: 'Dish Not Found',
      });
      const result = await service.deleteDish(userArgs, deleteDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Dish Not Found',
      });
    });

    it('should return failed server error', async () => {
      dishRepository.findOneOrThrow.mockRejectedValue(new Error());

      const result = await service.deleteDish(userArgs, deleteDishInput);

      expect(result).toEqual({
        ok: false,
        error: 'Could not DeleteDish',
      });
    });
  });
});
