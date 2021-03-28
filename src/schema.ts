import {
  makeSchema,
  nonNull,
  objectType,
  inputObjectType,
  intArg,
  arg,
  stringArg,
  asNexusMethod,
  queryType
} from 'nexus'
import { GraphQLDateTime } from 'graphql-iso-date'
import { Context } from './context'

export const DateTime = asNexusMethod(GraphQLDateTime, 'date')

const Query = queryType({
  definition(t) {
    t.nonNull.list.nonNull.field('allUsers', {
      type: 'User',
      resolve: (_parent, _args, context: Context) => {
        return context.prisma.user.findMany()
      },
    })

    t.field('user', {
      type: 'User',
      args: { id: nonNull(intArg()) },
      resolve(_parent, args, ctx) {
        return ctx.prisma.user.findUnique({ where: { id: args.id } })
      },
    })
  },
})

const Mutation = objectType({
  name: 'Mutation',
  definition(t) {

    // other mutations

   t.field('addProfileForUser', {
     type: 'Profile',
     args: {
       userUniqueInput: nonNull(
         arg({
           type: 'UserUniqueInput',
         }),
       ),
       bio: stringArg()
     }, 
     resolve: async (_, args, context) => {
       return context.prisma.profile.create({
         data: {
           bio: args.bio,
           user: {
             connect: {
               id: args.userUniqueInput.id || undefined,
               email: args.userUniqueInput.email || undefined,
             }
           }
         }
       })
     }
   })
  }
})

const User = objectType({
  name: 'User',
  definition(t) {
    t.nonNull.int('id')
    t.string('name')
    t.nonNull.string('email')
    t.field('profile', {
      type: 'Profile',
      resolve: (parent, _, context) => {
        return context.prisma.user.findUnique({
          where: { id: parent.id }
        }).profile()
      }
    })
  },
})

const Profile = objectType({
  name: 'Profile',
  definition(t) {
    t.nonNull.int('id')
    t.string('bio')
    t.field('user', {
      type: 'User',
      resolve: (parent, _, context) => {
        return context.prisma.profile
          .findUnique({
            where: { id: parent.id || undefined },
          })
          .user()
      },
    })
  },
})

const UserUniqueInput = inputObjectType({
  name: 'UserUniqueInput',
  definition(t) {
    t.int('id')
    t.string('email')
  },
})

const UserCreateInput = inputObjectType({
  name: 'UserCreateInput',
  definition(t) {
    t.nonNull.string('email')
    t.string('name')
  },
})

export const schema = makeSchema({
  types: [
    Query,
    Mutation,
    User,
    Profile,
    UserUniqueInput,
    UserCreateInput,
    DateTime,
  ],
  outputs: {
    schema: __dirname + '/../schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'Context',
  },
  sourceTypes: {
    modules: [
      {
        module: '@prisma/client',
        alias: 'prisma',
      },
    ],
  },
})