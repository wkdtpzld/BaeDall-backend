import { Field, InputType, ObjectType, Int } from '@nestjs/graphql';
import { Payment } from '../entities/payment.entity';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';

@InputType()
export class GetPaymentsInput extends PaginationInput {
  @Field(() => String, { nullable: true })
  transcationId?: string;
}

@ObjectType()
export class GetPaymentsOutput extends PaginationOutput {
  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];
}
