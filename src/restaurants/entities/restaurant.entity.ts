import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Category } from './category.entity';
import { Dish } from '../../dish/entites/dish.entity';
import { Order } from 'src/orders/entities/order.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Field(() => String)
  @Column()
  name: string;

  @Field(() => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field(() => String)
  @Column()
  address: string;

  @Field(() => Category, { nullable: true })
  @ManyToOne(() => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category: Category;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.restaurants, { onDelete: 'CASCADE' })
  owner: User;

  @Field(() => [Dish])
  @OneToMany(() => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  @Field(() => Int)
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.restaurant)
  orders: Order[];
}
