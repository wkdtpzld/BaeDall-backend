import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

const TEST_KEY = 'testKey';
const USER_ID = 1;

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockRepository = () => ({
  findOne: jest.fn(
    () =>
      function sendMail() {
        return null;
      },
  ),
});

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => 'token'),
    verify: jest.fn((token: string) => {
      if (token === 'TOKEN') {
        return true;
      } else {
        throw new Error();
      }
    }),
    decode: jest.fn(() => {
      return {
        payload: [
          {
            id: USER_ID,
          },
        ],
      };
    }),
  };
});

describe('JwtService', () => {
  let service: JwtService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
      ],
    }).compile();
    service = module.get<JwtService>(JwtService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sign', () => {
    it('should return a signed token', () => {
      const token = service.sign({ id: 1 });
      expect(typeof token).toBe('string');
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, TEST_KEY, {
        algorithm: 'HS256',
        expiresIn: '1d',
      });
    });
  });

  describe('verify', () => {
    it('should return the decoded token', () => {
      const TOKEN = 'TOKEN';
      const result = service.verify('TOKEN');
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);

      expect(jwt.decode).toHaveBeenCalledTimes(1);
      expect(jwt.decode).toHaveBeenCalledWith(TOKEN, { complete: true });
      expect(result).toEqual({
        ok: true,
        verify: true,
        decode: {
          payload: [
            {
              id: USER_ID,
            },
          ],
        },
      });
    });

    it('should return fail', () => {
      const result = service.verify('FAKE_TOKEN');
      expect(result).toEqual({ ok: false });
    });

    it('should return the refreshToken', () => {
      const result = service.refresh();

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(jwt.sign).toHaveBeenCalledWith({}, TEST_KEY, {
        algorithm: 'HS256',
        expiresIn: '14d',
      });
      expect(result).toEqual('token');
    });

    describe('refreshVerify', () => {
      const UserArgs = {
        id: 1,
        refreshToken: 'TOKEN',
      };

      const UserArgs2 = {
        id: 2,
        refreshToken: 'TOKEN2',
      };

      it('should return success Token', async () => {
        const TOKEN = 'TOKEN';
        userRepository.findOne.mockResolvedValue(UserArgs);
        const result = await service.refreshVerify(TOKEN, USER_ID);

        expect(userRepository.findOne).toHaveBeenCalledTimes(1);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { id: UserArgs.id },
        });

        expect(jwt.verify).toHaveBeenCalledTimes(3);
        expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);

        expect(result).toEqual({
          ok: true,
          decoded: true,
        });
      });

      it('should return fakeToken result', async () => {
        const TOKEN = 'TOKEN';
        userRepository.findOne.mockResolvedValue(UserArgs2);
        const result = await service.refreshVerify(TOKEN, USER_ID);

        expect(userRepository.findOne).toHaveBeenCalledTimes(1);
        expect(userRepository.findOne).toHaveBeenCalledWith({
          where: { id: USER_ID },
        });

        expect(jwt.verify).toHaveBeenCalledTimes(4);
        expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);

        expect(result).toEqual({
          ok: false,
          message: 'is not Matched Token',
        });
      });

      it('should failed throw error', async () => {
        const TOKEN = 'TOKEN';
        userRepository.findOne.mockRejectedValue(new Error());
        const result = await service.refreshVerify(TOKEN, USER_ID);

        expect(result).toEqual({ ok: false, message: 'refreshVerify Failed' });
      });
    });
  });

  it.todo('sign');
  it.todo('verify');
  it.todo('refresh');
  it.todo('refreshVerify');
});
