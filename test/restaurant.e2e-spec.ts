import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { User } from 'src/users/entities/user.entity';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { Verification } from '../src/users/entities/verification.entity';
import { Restaurant } from '../src/restaurants/entities/restaurant.entity';
import { Category } from '../src/restaurants/entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RestaurantRepository } from '../src/restaurants/repositories/restaurant.repository';
import { CategoryRepository } from '../src/restaurants/repositories/categories.repository';

describe('RestaurantModule (e2e)', () => {
  let app: INestApplication;
  let server;
  let accessToken: string;
  let refreshToken: string;
  let secondAccessToken: string;
  let secondRefreshToken: string;
  let userRepository: Repository<User>;
  let restaurantRepository: RestaurantRepository;
  let categoryRepository: CategoryRepository;

  const GRAPH_END_POINT = '/graphql';
  const EMAIL = 'slwhswk@naver.com';
  const PASSWORD = '12345';

  const baseTest = () => request(app.getHttpServer()).post(GRAPH_END_POINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('x-jwt', accessToken).send({ query });

  const secondUserPrivateTest = (query: string) =>
    baseTest().set('x-jwt', secondAccessToken).send({ query });

  const fakePrivateTest = (query: string) =>
    baseTest().set('x-jwt', 'fakeToken').send({ query });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get(getRepositoryToken(User));
    restaurantRepository = moduleFixture.get(
      getRepositoryToken(RestaurantRepository),
    );
    categoryRepository = moduleFixture.get(
      getRepositoryToken(CategoryRepository),
    );
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      synchronize: true,
      logging: false,
      entities: [User, Verification, Restaurant, Category],
    });
    const connection = await dataSource.initialize();
    await connection.dropDatabase();
    await connection.destroy();
    await app.close();
  });

  describe('user Setting', () => {
    it('should create account', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}",
            role: Owner
          }) {
            error
            ok
          }
        }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should create second account', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${EMAIL}2",
            password: "${PASSWORD}2",
            role: Owner
          }) {
            error
            ok
          }
        }`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });

    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input: {
              email: "${EMAIL}",
              password: "${PASSWORD}"
            }) {
              ok
              error
              accessToken
              refreshToken
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.accessToken).toEqual(expect.any(String));
          accessToken = login.accessToken;
          refreshToken = login.refreshToken;
        });
    });

    it('should login with correct credentials', () => {
      return publicTest(`
          mutation {
            login(input: {
              email: "${EMAIL}2",
              password: "${PASSWORD}2"
            }) {
              ok
              error
              accessToken
              refreshToken
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.accessToken).toEqual(expect.any(String));
          secondAccessToken = login.accessToken;
          secondRefreshToken = login.refreshToken;
        });
    });
  });

  describe('createRestaurant', () => {
    it('should success createRestaurant', () => {
      return privateTest(`
      mutation {
        createRestaurant(input: {
          name: "lol",
          coverImg: "http://",
          address: "22333 seoul",
          categoryName: "bbq"
        }) {
          ok
          error
        }
      }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createRestaurant },
            },
          } = res;
          expect(createRestaurant.ok).toBe(true);
          expect(createRestaurant.error).toBe(null);
        });
    });
  });

  describe('editRestaurant', () => {
    const restaurantId = 1;
    const fakeRestaurantId = 7777;

    it('should success editRestaurant', () => {
      privateTest(`
        mutation {
          editRestaurant(input: {
            name: "newName"
            restaurantId: ${restaurantId}
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { editRestaurant },
            },
          } = res;

          expect(editRestaurant.ok).toBe(true);
          expect(editRestaurant.error).toBe(null);
        });
    });

    it('sholud failed Forbidden resource', () => {
      fakePrivateTest(`
        mutation {
          editRestaurant(input: {
            name: "newName"
            restaurantId: ${restaurantId}
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { editRestaurant },
            },
          } = res;
          expect(editRestaurant.ok).toBe(false);
          expect(editRestaurant.error).toEqual(expect.any(String));
        });
    });

    it('should failed beacuse not found editRestaurant', () => {
      privateTest(`
        mutation {
          editRestaurant(input: {
            name: "newName"
            restaurantId: ${fakeRestaurantId}
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { editRestaurant },
            },
          } = res;

          expect(editRestaurant.ok).toBe(false);
          expect(editRestaurant.error).toEqual(expect.any(String));
        });
    });

    it('should failed beacuse not found editRestaurant', () => {
      secondUserPrivateTest(`
        mutation {
          editRestaurant(input: {
            name: "newName"
            restaurantId: ${restaurantId}
          }) {
            ok
            error
          }
        }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { editRestaurant },
            },
          } = res;

          expect(editRestaurant.ok).toBe(false);
          expect(editRestaurant.error).toBe('Not Match OwnerId');
        });
    });
  });

  describe('restaurants', () => {
    it('should return allRestaurant page 1', () => {
      return publicTest(`
      {
        restaurants(input: {
          page: 1
        }) {
          ok
          error
          totalPage
          totalItems
          restaurants {
            id
            name
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { restaurants },
            },
          } = res;

          expect(restaurants.ok).toBe(true);
          expect(restaurants.error).toBe(null);
          expect(restaurants.totalPage).toEqual(expect.any(Number));
          expect(restaurants.totalItems).toEqual(expect.any(Number));
          expect(restaurants.restaurants).toEqual(expect.any(Array));
        });
    });
  });

  describe('restaurant', () => {
    const restaurantId = 1;
    const fakeRestaurantId = 7777;

    it('should return restaurnt', () => {
      return publicTest(`
      {
        restaurant(input: {
          restaurantId: ${restaurantId}
        }) {
          ok
          error
          restaurant {
            id
            name
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { restaurant },
            },
          } = res;

          expect(restaurant.ok).toBe(true);
          expect(restaurant.error).toBe(null);
          expect(restaurant.restaurant).toEqual(Object);
        });
    });

    it('should return restaurnt', () => {
      return publicTest(`
      {
        restaurant(input: {
          restaurantId: ${fakeRestaurantId}
        }) {
          ok
          error
          restaurant {
            id
            name
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { restaurant },
            },
          } = res;

          expect(restaurant.ok).toBe(false);
          expect(restaurant.error).toBe('Restaurant Not Found');
        });
    });
  });

  describe('searchRestaurant', () => {
    it('should return searchRestaurants', () => {
      return publicTest(`
      {
        searchRestaurant(input: {
          page: 1,
          query: "",
        }) {
          ok
          error
          totalPage
          totalItems
          restaurants {
            id
            name
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { searchRestaurant },
            },
          } = res;

          expect(searchRestaurant.ok).toBe(true);
          expect(searchRestaurant.error).toBe(null);
          expect(searchRestaurant.totalPage).toEqual(expect.any(Number));
          expect(searchRestaurant.totalItems).toEqual(expect.any(Number));
          expect(searchRestaurant.restaurants).toEqual(expect.any(Array));
        });
    });
  });

  describe('allCategories', () => {
    it('should return allCategories', () => {
      return publicTest(`
      {
        allCategories {
          ok
          error
          categories {
            id
            name
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { allCategories },
            },
          } = res;

          expect(allCategories.ok).toBe(true);
          expect(allCategories.error).toBe(null);
          expect(allCategories.categories).toEqual(expect.any(Array));
        });
    });
  });

  describe('category', () => {
    const slug = 'bbq';
    it('should return category slug', () => {
      return publicTest(`
      {
        category(input: {
          page: 1,
          slug: "${slug}",
        }) {
          ok
          error
          totalPage
          totalItems
          category {
            id
            name
          }
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { category },
            },
          } = res;

          expect(category.ok).toBe(true);
          expect(category.error).toBe(null);
          expect(category.totalPage).toEqual(expect.any(Number));
          expect(category.totalItems).toEqual(expect.any(Number));
          expect(category.category).toEqual(expect.any(Array));
        });
    });
  });

  describe('deleteRestaurant', () => {
    const restaurantId = 1;
    const fakeRestaurantId = 7777;

    it('should failed because not found restaurant', () => {
      return privateTest(`
      mutation {
        deleteRestaurant(input: {
          restaurantId: ${fakeRestaurantId}
        }) {
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { deleteRestaurant },
            },
          } = res;

          expect(deleteRestaurant.ok).toBe(false);
          expect(deleteRestaurant.error).toBe('Restaurant not found');
        });
    });

    it('should failed not match ownerId', () => {
      return secondUserPrivateTest(`
      mutation {
        deleteRestaurant(input: {
          restaurantId: ${restaurantId}
        }) {
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { deleteRestaurant },
            },
          } = res;
          expect(deleteRestaurant.ok).toBe(false);
          expect(deleteRestaurant.error).toBe('Not Match OwnerId');
        });
    });

    it('should success deleteRestaurant', () => {
      return privateTest(`
      mutation {
        deleteRestaurant(input: {
          restaurantId: ${restaurantId}
        }) {
          ok
          error
        }
      }
      `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { deleteRestaurant },
            },
          } = res;
          expect(deleteRestaurant.ok).toBe(true);
          expect(deleteRestaurant.error).toBe(null);
        });
    });
  });
});
