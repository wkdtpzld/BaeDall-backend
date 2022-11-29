import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Role } from 'src/auth/role.decorator';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import { User } from '../users/entities/user.entity';
import { GetPaymentsInput, GetPaymentsOutput } from './dtos/payments.dto';

@Resolver(() => Payment)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Mutation(() => CreatePaymentOutput)
  @Role(['Owner'])
  createPayment(
    @AuthUser() owner: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return this.paymentService.createPayment(owner, createPaymentInput);
  }

  @Query(() => GetPaymentsOutput)
  @Role(['Owner'])
  getPayments(
    @AuthUser() owner: User,
    @Args('input') getPaymentsInput: GetPaymentsInput,
  ): Promise<GetPaymentsOutput> {
    return this.paymentService.getPayments(owner, getPaymentsInput);
  }
}
