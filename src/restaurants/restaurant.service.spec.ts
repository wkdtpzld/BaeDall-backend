import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RestaurantService } from './restaurants.service';
import { RestaurantRepository } from './repositories/restaurant.repository';
import { CategoryRepository } from './repositories/categories.repository';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Category } from './entities/category.entity';
import { ILike } from 'typeorm';
import { DishRepository } from 'src/dish/repository/dishes-repository';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
  IsMatchOwner: jest.fn(),
  getOrCreate: jest.fn(),
  count: jest.fn(),
  findAndCount: jest.fn(),
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

const category: Category = {
  id: 1,
  coverImg: 'http://',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'category',
  restaurants: null,
  slug: 'korean-bbq',
};

describe('restaurantService', () => {
  let service: RestaurantService;
  let restaurantRepository: Partial<
    Record<keyof RestaurantRepository, jest.Mock>
  >;
  let dishRepository: Partial<Record<keyof DishRepository, jest.Mock>>;
  let categoryRepository: Partial<Record<keyof CategoryRepository, jest.Mock>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: getRepositoryToken(CategoryRepository),
          useValue: mockRepository(),
        },
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
    service = module.get<RestaurantService>(RestaurantService);
    restaurantRepository = module.get(getRepositoryToken(RestaurantRepository));
    categoryRepository = module.get(getRepositoryToken(CategoryRepository));
    dishRepository = module.get(getRepositoryToken(DishRepository));
  });

  it('to be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurant', () => {
    const restaurantArgs = {
      name: 'test',
      coverImg: 'http://',
      address: 'seoul 22333',
      categoryName: 'bbq',
    };

    it('should success create Restaurant', async () => {
      restaurantRepository.create.mockResolvedValue(restaurantArgs);
      categoryRepository.getOrCreate.mockResolvedValue(category);
      const result = await service.createRestaurant(userArgs, restaurantArgs);

      expect(restaurantRepository.create).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.create).toHaveBeenCalledWith(restaurantArgs);

      expect(categoryRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(categoryRepository.getOrCreate).toHaveBeenCalledWith(
        restaurantArgs.categoryName,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should failed because category', async () => {
      restaurantRepository.create.mockRejectedValue(new Error());
      const result = await service.createRestaurant(userArgs, restaurantArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Could not create restaurant',
      });
    });
  });
  describe('editRestaurant', () => {
    const editProfileInputArgs = {
      categoryName: 'editName',
      restaurantId: 1,
    };

    it('should Edit Restaurant', async () => {
      const category = {
        id: 1,
      };
      restaurantRepository.IsMatchOwner.mockResolvedValue(null);
      categoryRepository.getOrCreate.mockResolvedValue(category);
      const result = await service.editRestaurant(
        userArgs,
        editProfileInputArgs,
      );

      expect(restaurantRepository.IsMatchOwner).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.IsMatchOwner).toHaveBeenCalledWith(
        userArgs,
        editProfileInputArgs.restaurantId,
      );

      expect(categoryRepository.getOrCreate).toHaveBeenCalledTimes(1);
      expect(categoryRepository.getOrCreate).toHaveBeenCalledWith(
        editProfileInputArgs.categoryName,
      );

      expect(restaurantRepository.save).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.save).toHaveBeenCalledWith([
        {
          id: editProfileInputArgs.restaurantId,
          ...editProfileInputArgs,
          ...(category && { category }),
        },
      ]);

      expect(result).toEqual({ ok: true });
    });

    it('should failed restaurant not found', async () => {
      restaurantRepository.IsMatchOwner.mockResolvedValue({
        ok: false,
        error: 'Restaurant not found',
      });

      const result = await service.editRestaurant(
        userArgs,
        editProfileInputArgs,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found',
      });
    });

    it('should failed restaurant not match', async () => {
      restaurantRepository.IsMatchOwner.mockResolvedValue({
        ok: false,
        error: 'Not Match OwnerId',
      });

      const result = await service.editRestaurant(
        userArgs,
        editProfileInputArgs,
      );

      expect(result).toEqual({ ok: false, error: 'Not Match OwnerId' });
    });

    it('should failed restaurant server Error', async () => {
      restaurantRepository.IsMatchOwner.mockRejectedValue(new Error());

      const result = await service.editRestaurant(
        userArgs,
        editProfileInputArgs,
      );

      expect(result).toEqual({ ok: false, error: 'Could not edit Restaurant' });
    });
  });
  describe('deleteRestaurant', () => {
    const deleteRestaurantInput = {
      restaurantId: 1,
    };

    it('should delete restaurant', async () => {
      restaurantRepository.IsMatchOwner.mockResolvedValue(null);
      const result = await service.deleteRestaurant(
        userArgs,
        deleteRestaurantInput,
      );

      expect(restaurantRepository.IsMatchOwner).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.IsMatchOwner).toHaveBeenCalledWith(
        userArgs,
        deleteRestaurantInput.restaurantId,
      );

      expect(restaurantRepository.delete).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.delete).toHaveBeenCalledWith(
        deleteRestaurantInput.restaurantId,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should return IsMatch is Failed not found', async () => {
      restaurantRepository.IsMatchOwner.mockResolvedValue({
        ok: false,
        error: 'Restaurant not found',
      });
      const result = await service.deleteRestaurant(
        userArgs,
        deleteRestaurantInput,
      );

      expect(result).toEqual({ ok: false, error: 'Restaurant not found' });
    });

    it('should failed restaurant not match', async () => {
      restaurantRepository.IsMatchOwner.mockResolvedValue({
        ok: false,
        error: 'Not Match OwnerId',
      });

      const result = await service.deleteRestaurant(
        userArgs,
        deleteRestaurantInput,
      );

      expect(result).toEqual({ ok: false, error: 'Not Match OwnerId' });
    });

    it('should delete restaurant Failed Occur Server Error', async () => {
      restaurantRepository.IsMatchOwner.mockResolvedValue(null);
      restaurantRepository.delete.mockRejectedValue(new Error());
      const result = await service.deleteRestaurant(
        userArgs,
        deleteRestaurantInput,
      );

      expect(result).toEqual({
        ok: false,
        error: 'Could Not Delete Restaurant',
      });
    });
  });
  describe('allCategories', () => {
    const categories = [
      {
        id: 1,
      },
    ];

    it('should get allCategories', async () => {
      categoryRepository.find.mockResolvedValue(categories);
      const result = await service.allCategories();

      expect(categoryRepository.find).toHaveBeenCalledTimes(1);
      expect(categoryRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual({
        ok: true,
        categories,
      });
    });

    it('should failed get allCategories', async () => {
      categoryRepository.find.mockRejectedValue(new Error());
      const result = await service.allCategories();

      expect(categoryRepository.find).toHaveBeenCalledTimes(1);
      expect(categoryRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual({
        ok: false,
        error: 'Could not load Categories',
      });
    });
  });
  describe('countRestaurant', () => {
    it('should get CountRestaurant', async () => {
      restaurantRepository.count.mockResolvedValue(1);
      const result = await service.countRestaurant(category);

      expect(restaurantRepository.count).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.count).toHaveBeenCalledWith({
        where: { category: { id: category.id } },
      });
      expect(result).toEqual(1);
    });
  });
  describe('findCategoryBySlug', () => {
    const categoryInput = {
      page: 1,
      slug: 'korean-bbq',
    };

    it('should find Category', async () => {
      categoryRepository.findOne.mockResolvedValue(category);
      restaurantRepository.find.mockResolvedValue([{ id: 1 }]);
      restaurantRepository.count.mockResolvedValue(1);
      const result = await service.findCategoryBySlug(categoryInput);

      expect(categoryRepository.findOne).toHaveBeenCalledTimes(1);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { slug: categoryInput.slug },
        relations: ['restaurants'],
      });

      expect(restaurantRepository.find).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.find).toHaveBeenCalledWith({
        where: {
          category: { id: 1 },
        },
        take: 20,
        skip: (categoryInput.page - 1) * 25,
      });

      expect(restaurantRepository.count).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.count).toHaveBeenCalledWith({
        where: { category: { id: category.id } },
      });

      expect(result).toEqual({
        ok: true,
        category,
        totalPage: expect.any(Number),
        totalItems: expect.any(Number),
      });
    });

    it('should failed beacuse not found catrgory', async () => {
      categoryRepository.findOne.mockResolvedValue(null);
      const result = await service.findCategoryBySlug(categoryInput);

      expect(categoryRepository.findOne).toHaveBeenCalledTimes(1);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { slug: categoryInput.slug },
        relations: ['restaurants'],
      });

      expect(restaurantRepository.find).toHaveBeenCalledTimes(0);

      expect(result).toEqual({
        ok: false,
        error: 'Category not found',
      });
    });

    it('should failed catch Error', async () => {
      categoryRepository.findOne.mockRejectedValue(new Error());
      const result = await service.findCategoryBySlug(categoryInput);
      expect(result).toEqual({
        ok: false,
        error: 'Could Not find Category Because occured Error',
      });
    });
  });
  describe('allRestaurant', () => {
    const restaurantInput = {
      page: 1,
    };
    it('should return allRestaurants', async () => {
      restaurantRepository.findAndCount.mockResolvedValue([{ id: 1 }, 1]);
      const result = await service.allRestaurant(restaurantInput);

      expect(restaurantRepository.findAndCount).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findAndCount).toHaveBeenCalledWith({
        skip: (restaurantInput.page - 1) * 20,
        take: 20,
      });

      expect(result).toEqual({
        ok: true,
        restaurants: expect.any(Object),
        totalPage: expect.any(Number),
        totalItems: expect.any(Number),
      });
    });

    it('should return failed', async () => {
      restaurantRepository.findAndCount.mockRejectedValue(new Error());
      const result = await service.allRestaurant(restaurantInput);

      expect(result).toEqual({
        ok: false,
        error: 'Could not load restaurants',
      });
    });
  });
  describe('findRestaurantById', () => {
    const restaurantArgs = {
      restaurantId: 1,
    };
    it('should return findRestaurant', async () => {
      restaurantRepository.findOne.mockResolvedValue(restaurantArgs);
      const result = await service.findRestaurantById(restaurantArgs);

      expect(restaurantRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findOne).toHaveBeenCalledWith({
        where: { id: restaurantArgs.restaurantId },
        relations: ['menu'],
      });

      expect(result).toEqual({
        ok: true,
        restaurant: restaurantArgs,
      });
    });

    it('should failed not found Restaurant', async () => {
      restaurantRepository.findOne.mockResolvedValue(null);
      const result = await service.findRestaurantById(restaurantArgs);

      expect(result).toEqual({
        ok: false,
        error: 'Restaurant Not Found',
      });
    });

    it('should failed catch Error', async () => {
      restaurantRepository.findOne.mockRejectedValue(new Error());
      const result = await service.findRestaurantById(restaurantArgs);

      expect(result).toEqual({
        ok: false,
        error: 'Could not Find Restaurant',
      });
    });
  });
  describe('searchRestaurantByName', () => {
    const restaurantInput = {
      page: 1,
      query: 'bbq',
    };
    it('should return searchRestaurant', async () => {
      restaurantRepository.findAndCount.mockResolvedValue([{ id: 1 }, 1]);
      const result = await service.searchRestaurantByName(restaurantInput);

      expect(restaurantRepository.findAndCount).toHaveBeenCalledTimes(1);
      expect(restaurantRepository.findAndCount).toHaveBeenCalledWith({
        where: { name: ILike(`%${restaurantInput.query}%`) },
        skip: (restaurantInput.page - 1) * 20,
        take: 20,
      });

      expect(result).toEqual({
        ok: true,
        restaurants: expect.any(Object),
        totalItems: expect.any(Number),
        totalPage: expect.any(Number),
      });
    });

    it('should return failed catch error', async () => {
      restaurantRepository.findAndCount.mockRejectedValue(new Error());
      const result = await service.searchRestaurantByName(restaurantInput);

      expect(result).toEqual({
        ok: false,
        error: 'Could not Search Restaurant',
      });
    });
  });
});
