import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { Dish } from 'src/dish/entites/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  choices: string;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @Field(() => Dish)
  @ManyToOne(() => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field(() => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: OrderItemOption[];
}
