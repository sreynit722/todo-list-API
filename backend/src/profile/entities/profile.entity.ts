import { Column, Entity, PrimaryColumn } from 'typeorm';

// This app has a single user, so the table holds one row with id = 1.
@Entity('profiles')
export class Profile {
  @PrimaryColumn()
  id: number;

  @Column({ length: 40 })
  username: string;

  @Column({ length: 40 })
  displayName: string;

  @Column({ length: 255 })
  email: string;
}
