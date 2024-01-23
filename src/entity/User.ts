import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum RewardStatus {
  Ineligible = 'ineligible',
  Eligible = 'eligible',
  Claimed = 'claimed'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "text",
    default: RewardStatus.Eligible
  })
  free_share_status!: RewardStatus;
}


