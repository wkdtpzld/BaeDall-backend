import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderRepository extends Repository<Order> {
  constructor(private dataSource: DataSource) {
    super(Order, dataSource.createEntityManager());
  }
}
