import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from './output.dto';

@InputType()
export class PaginationInput {
  @Field(() => Number, { defaultValue: 1 })
  page: number;
}

@ObjectType()
export class PaginationOutput extends CoreOutput {
  @Field(() => Number, { nullable: true })
  totalPage?: number;

  @Field(() => Number, { nullable: true })
  totalItems?: number;
}
