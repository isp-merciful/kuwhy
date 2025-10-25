import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by session ID (which is user_id in our system)
    const user = await prisma.users.findUnique({
      where: { user_id: session.user.id },
      select: {
        user_id: true,
        user_name: true,
        email: true,
        img: true,
        gender: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, bio, location, website, phone, password } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ 
        error: 'Name and email are required' 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.users.findFirst({
      where: {
        email: email,
        NOT: { user_id: session.user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Email is already taken by another user' 
      }, { status: 409 });
    }

    // Prepare update data
    const updateData = {
      user_name: name,
      email: email,
      updated_at: new Date()
    };

    // Add password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters' 
        }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user in database
    const updatedUser = await prisma.users.update({
      where: { user_id: session.user.id },
      data: updateData,
      select: {
        user_id: true,
        user_name: true,
        email: true,
        img: true,
        gender: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
