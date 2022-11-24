import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  @Length(5)
  name: string;

  @Field(() => Int)
  @Column()
  @IsNumber()
  price: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field(() => String)
  @Column()
  @Length(5, 100)
  description: string;

  @Field(() => Restaurant)
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Field(() => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(() => String)
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  extra?: number;
}

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  name: string;

  @Field(() => Int, { nullable: true })
  extra?: number;
}
