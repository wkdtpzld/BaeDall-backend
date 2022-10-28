import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, IsBoolean, Length } from 'class-validator';

@ArgsType()
export class CreateRestaurantDtO {
  @Field((type) => String)
  @IsString()
  @Length(5, 10)
  name: string;

  @Field((type) => Boolean)
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String)
  @IsString()
  address: string;

  @Field((type) => String)
  @IsString()
  @Length(5, 10)
  ownersName: string;
}
