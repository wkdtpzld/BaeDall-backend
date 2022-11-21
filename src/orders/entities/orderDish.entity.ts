import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Dish } from 'src/dish/entites/dish.entity';
import { Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Order } from './order.entity';

@InputType('OrderDishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderDish extends CoreEntity {
  @Field(() => Dish)
  @ManyToOne(() => Dish, (dish) => dish.orderDish, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  dish: Dish;

  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.orderDish, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  order: Order;
}
