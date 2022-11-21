import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
  Int,
} from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { Dish } from '../entites/dish.entity';

@InputType()
export class EditDishInput extends PartialType(
  PickType(Dish, ['name', 'options', 'price', 'description']),
) {
  @Field(() => Int)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends CoreOutput {}
