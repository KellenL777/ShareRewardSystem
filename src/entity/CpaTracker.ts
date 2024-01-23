import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CpaTracker {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "float", default: 0 })
  totalSpent!: number;

  @Column({ type: "int", default: 0 })
  sharesGiven!: number;
}
