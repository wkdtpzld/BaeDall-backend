import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentRepository extends Repository<Payment> {
  constructor(private dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }
}
