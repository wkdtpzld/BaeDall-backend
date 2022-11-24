import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrderItemRepository extends Repository<OrderItem> {
  constructor(private dataSource: DataSource) {
    super(OrderItem, dataSource.createEntityManager());
  }
}
