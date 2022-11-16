import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'signed-token'),
  verify: jest.fn(() => {
    return {
      ok: true,
      decode: {
        payload: [
          {
            id: 1,
          },
        ],
      },
    };
  }),
  refresh: jest.fn(() => 'refresh-token'),
  refreshVerify: jest.fn((token: string) => {
    if (token === 'refreshtoken') {
      return {
        ok: true,
        decoded: true,
      };
    } else {
      return {
        ok: true,
        decoded: false,
        message: 'is not Matched Token',
      };
    }
  }),
});

const mockMailService = () => ({
  sendEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: MockRepository<User>;
  let veriifcationRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    veriifcationRepository = module.get(getRepositoryToken(Verification));
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: UserRole.Client,
    };
    it('should fail if user exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: '등록된 이메일입니다.',
      });
    });
    it('should create a new User', async () => {
      userRepository.findOne.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue(createAccountArgs);
      userRepository.save.mockResolvedValue(createAccountArgs);
      veriifcationRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      veriifcationRepository.save.mockResolvedValue({
        code: '',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);
      expect(veriifcationRepository.create).toHaveBeenCalledTimes(1);
      expect(veriifcationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(veriifcationRepository.save).toHaveBeenCalledTimes(1);
      expect(veriifcationRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({
        ok: true,
      });
    });
    it('should fail on exception', async () => {
      userRepository.findOne.mockRejectedValue(new Error(''));
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: 'Couldn`t create account' });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'slwhswk@naver.com',
      password: '12345',
    };
    it('should fail if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: 'User not found',
      });
    });
    it('should fail if the password is wrong', async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      userRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Wrong Password',
      });
    });
    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      const updateUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
        refreshToken: 'refresh-token',
      };
      userRepository.findOne.mockResolvedValue(mockedUser);
      userRepository.update.mockReturnValue(updateUser);
      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object));
      expect(jwtService.refresh).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ok: true,
        accessToken: 'signed-token',
        refreshToken: 'refresh-token',
      });
    });
    it('should fail on exception', async () => {
      userRepository.findOne.mockResolvedValue(new Error());
      userRepository.update.mockReturnValue(new Error());

      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: 'Login Failed occured ServerError',
      });
    });
  });
  describe('findById', () => {
    const findByIdArgs = {
      id: 1,
    };

    it('should find an existing user', async () => {
      userRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if no user is found', async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ ok: false, error: 'User Not Found' });
    });
  });

  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: 'temp@naver.com',
        verified: true,
      };
      const editProfileArgs = {
        userId: 1,
        input: { email: 'temp@new.com' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        email: editProfileArgs.input.email,
        verified: false,
      };
      userRepository.findOne.mockResolvedValue(oldUser);
      veriifcationRepository.create.mockReturnValue(newVerification);
      veriifcationRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editProfileArgs.userId, editProfileArgs.input);
      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: editProfileArgs.userId },
      });

      expect(veriifcationRepository.create).toHaveBeenCalledTimes(1);
      expect(veriifcationRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });

      expect(veriifcationRepository.save).toHaveBeenCalledTimes(1);
      expect(veriifcationRepository.save).toHaveBeenCalledWith(newVerification);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
    });
    it('should change password', async () => {
      const editProfileArgs = {
        userId: 1,
        input: { password: '123456' },
      };
      userRepository.findOne.mockResolvedValue({ password: '12345' });
      const result = await service.editProfile(
        editProfileArgs.userId,
        editProfileArgs.input,
      );

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(editProfileArgs.input);
      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: '12' });
      expect(result).toEqual({ ok: false, error: 'Could not update Profile' });
    });
  });

  describe('verifyEmail', () => {
    it('should verify exception', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      veriifcationRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail('');

      expect(veriifcationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(veriifcationRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
      );
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(mockedVerification.user);

      expect(veriifcationRepository.delete).toHaveBeenCalledTimes(1);
      expect(veriifcationRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on verification not found', async () => {
      veriifcationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Verification not found' });
    });

    it('should fail on exception', async () => {
      veriifcationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail('');
      expect(result).toEqual({ ok: false, error: 'Could not verify Email' });
    });
  });

  describe('IsMatchRefreshToken', () => {
    it('should Match user Refreshtoken', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        refreshToken: 'refreshtoken',
      });
      const result = await service.IsMatchRefreshToken(
        'accesstoken',
        'refreshtoken',
      );

      expect(jwtService.verify).toHaveBeenCalledTimes(1);
      expect(jwtService.verify).toHaveBeenCalledWith(expect.any(String));

      expect(jwtService.refreshVerify).toHaveBeenCalledTimes(1);
      expect(jwtService.refreshVerify).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Object));

      expect(result).toEqual({ ok: true, accessToken: 'signed-token' });
    });
    it('should Not Match user RefreshToken', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        refreshToken: 'refreshtoken',
      });

      const result = await service.IsMatchRefreshToken(
        'accesstoken',
        'Fakerefreshtoken',
      );

      expect(jwtService.verify).toHaveBeenCalledTimes(1);
      expect(jwtService.verify).toHaveBeenCalledWith(expect.any(String));

      expect(jwtService.refreshVerify).toHaveBeenCalledTimes(1);
      expect(jwtService.refreshVerify).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
      );

      expect(result).toEqual({ ok: false, error: 'is not Matched Token' });
    });

    it('should Not Found User', async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.IsMatchRefreshToken(
        'accesstoken',
        'refreshtoken',
      );
      expect(result).toEqual({ error: 'Failed Server Error', ok: false });
    });
  });
});
