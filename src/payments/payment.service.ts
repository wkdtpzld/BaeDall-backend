import { PaymentRepository } from './repositories/payment.repository';
import { Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentsInput, GetPaymentsOutput } from './dtos/payments.dto';
import { ILike, LessThan } from 'typeorm';
import { Cron, Interval, SchedulerRegistry } from '@nestjs/schedule/dist';

@Injectable()
export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly restaurant: RestaurantRepository,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPayment(
    owner: User,
    { transcationId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurant.findOne({
        where: { id: restaurantId },
      });

      if (!restaurant) {
        return {
          ok: false,
          error: 'Not Found Restaurant',
        };
      }

      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Not Match Owner',
        };
      }

      restaurant.isPromoted = true;
      const date = new Date();
      date.setDate(date.getDate() + 7);
      restaurant.promotedUntil = date;

      this.restaurant.save(restaurant);

      await this.payments.save(
        this.payments.create({
          transcationId,
          user: owner,
          restaurant,
        }),
      );

      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not CreatePayment',
      };
    }
  }

  async getPayments(
    user: User,
    { page, transcationId }: GetPaymentsInput,
  ): Promise<GetPaymentsOutput> {
    try {
      const payments = await this.payments.find({
        where: {
          user: { id: user.id },
          transcationId: transcationId ? ILike(`%${transcationId}%`) : null,
        },
        take: 20,
        skip: (page - 1) * 25,
      });

      return {
        ok: true,
        payments,
      };
    } catch (e) {
      return {
        ok: false,
        error: 'Could Not GetPayments',
      };
    }
  }

  @Cron('* * * 1 * *')
  async checkPromotedRestaurants() {
    const restaurants = await this.restaurant.find({
      where: {
        isPromoted: true,
        promotedUntil: LessThan(new Date()),
      },
    });
    restaurants.forEach(async (restaurant) => {
      restaurant.isPromoted = false;
      restaurant.promotedUntil = null;
      await this.restaurant.save(restaurant);
    });
  }
}
