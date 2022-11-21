import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderDish } from './entities/orderDish.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderDish])],
  providers: [],
})
export class OrdersModule {}
