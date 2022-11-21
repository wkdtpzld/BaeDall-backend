import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Dish } from './entites/dish.entity';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Role } from 'src/auth/role.decorator';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { DishService } from './dish.service';
import { EditDishOutput, EditDishInput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';

@Resolver(() => Dish)
export class DishResolver {
  constructor(private readonly dishService: DishService) {}

  @Mutation(() => CreateDishOutput)
  @Role(['Owner'])
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.dishService.createDish(owner, createDishInput);
  }

  @Mutation(() => EditDishOutput)
  @Role(['Owner'])
  editDish(
    @AuthUser() owner: User,
    @Args('input') editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    return this.dishService.editDish(owner, editDishInput);
  }

  @Mutation(() => DeleteDishOutput)
  @Role(['Owner'])
  deleteDish(
    @AuthUser() owner: User,
    @Args('input') deleteDishInput: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    return this.dishService.deleteDish(owner, deleteDishInput);
  }
}
