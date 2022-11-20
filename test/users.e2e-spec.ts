import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { Verification } from 'src/users/entities/verification.entity';
import { DataSource, Repository } from 'typeorm';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Restaurant } from '../src/restaurants/entities/restaurant.entity';
import { Category } from '../src/restaurants/entities/category.entity';

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let server;
  let verificationRepository: Repository<Verification>;
  let userRepository: Repository<User>;
  let accessToken: string;
  let refreshToken: string;
  const GRAPH_END_POINT = '/graphql';
  const EMAIL = 'slwhswk@naver.com';
  const PASSWORD = '12345';

  const baseTest = () => request(app.getHttpServer()).post(GRAPH_END_POINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('x-jwt', accessToken).send({ query });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get(getRepositoryToken(User));
    verificationRepository = moduleFixture.get(
      getRepositoryToken(Verification),
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

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}",
            role: Client
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

    it('should fail if account already exists', () => {
      return publicTest(`
        mutation {
          createAccount(input: {
            email: "${EMAIL}",
            password: "${PASSWORD}",
            role: Client
          }) {
            error
            ok
          }
        }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(false);
          expect(createAccount.error).toBe('등록된 이메일입니다.');
        });
    });
  });

  describe('login', () => {
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

    it('should not be able to login with wrong credentials', () => {
      return publicTest(`
          mutation {
            login(input: {
              email: "${EMAIL}",
              password: "fakePassword"
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
          expect(login.ok).toBe(false);
          expect(login.error).toEqual(expect.any(String));
          expect(login.accessToken).toEqual(null);
          expect(login.refreshToken).toEqual(null);
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await userRepository.find();
      userId = user.id;
    });
    it("should see a user's profile", () => {
      return privateTest(`
        {
          userProfile(userId:${userId}){
            ok
            error
            user {
              id
            }
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it('should not find a userProfile', () => {
      return privateTest(`
        {
          userProfile(userId:666){
            ok
            error
            user {
              id
            }
          }
        }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toEqual(expect.any(String));
          expect(user).toBe(null);
        });
    });
  });
  describe('me', () => {
    it('should return find my profile', () => {
      return privateTest(`
          {
            me {
              email
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe('slwhswk@naver.com');
        });
    });
  });
  describe('editProfile', () => {
    it('should change email', () => {
      return privateTest(`
          mutation {
            editProfile(input: {
              email: "slwhswk9@gmail.com"
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
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should change password', () => {
      return privateTest(`
          mutation {
            editProfile(input: {
              password: "12366745"
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
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });
  });
  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });

    it('should verify email', () => {
      return publicTest(`
            mutation {
              verifyEmail(input: {
                code: "${verificationCode}"
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
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it('should return failed verify email', () => {
      return publicTest(`
            mutation {
              verifyEmail(input: {
                code: "fakeCode"
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
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toEqual(expect.any(String));
        });
    });
  });
  describe('refresh', () => {
    it('should return new accessToken', () => {
      return publicTest(`
      mutation {
        refresh(input: {
          accessToken: "${accessToken}",
          refreshToken: "${refreshToken}",
        }) {
          ok
          error
          accessToken
        }
      }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                refresh: { ok, error, accessToken },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(accessToken).toEqual(expect.any(String));
        });
    });

    it('should return failed because failedRefresh', () => {
      return publicTest(`
      mutation {
        refresh(input: {
          accessToken: "${accessToken}",
          refreshToken: "fakeRefreshToken",
        }) {
          ok
          error
          accessToken
        }
      }`)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                refresh: { ok, error, accessToken },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toEqual(expect.any(String));
          expect(accessToken).toBe(null);
        });
    });
  });
});
