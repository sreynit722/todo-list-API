import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Always stored lower-case
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 40 })
  username: string;

  @Column({ length: 40 })
  displayName: string;

  // select: false -> the hash is never loaded unless we ask for it (login only)
  @Column({ select: false })
  passwordHash: string;

  @CreateDateColumn()
  createdAt: Date;
}
