import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Payment } from './entities/payment.entity';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './repositories/payment.repository';
import { RestaurantRepository } from '../restaurants/repositories/restaurant.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Restaurant])],
  providers: [
    PaymentService,
    PaymentResolver,
    PaymentRepository,
    RestaurantRepository,
  ],
})
export class PaymentsModule {}
