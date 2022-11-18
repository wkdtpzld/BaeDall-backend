import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  name: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  coverImg: string;

  @Field(() => [Restaurant])
  @OneToMany(() => Restaurant, (restaurant) => restaurant.category)
  restaurants: Restaurant[];

  @Field(() => String)
  @Column({ unique: true })
  @IsString()
  @Index()
  slug: string;
}
