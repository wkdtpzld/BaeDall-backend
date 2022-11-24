import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { CreateOrderInput, CreateOrderOutput } from './dtos/createOrder.dto';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { User } from '../users/entities/user.entity';
import { Role } from 'src/auth/role.decorator';

@Resolver(() => Order)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Mutation(() => CreateOrderOutput)
  @Role(['Client'])
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }
}
