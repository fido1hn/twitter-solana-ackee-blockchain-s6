import PageHome from './components/PageHome.vue'
import PageTopics from './components/PageTopics.vue'
import PageUsers from './components/PageUsers.vue'
import PageProfile from './components/PageProfile.vue'
import PageTweet from './components/PageTweet.vue'
import PageNotFound from './components/PageNotFound.vue'

export default [
  {
    name: 'Home',
    path: '/',
    component: PageHome,
  },
  {
    name: 'Topics',
    path: '/topics/:topic?',
    component: PageTopics,
  },
  {
    name: 'Users',
    path: '/users/:author?',
    component: PageUsers,
  },
  {
    name: 'Profile',
    path: '/profile',
    component: PageProfile,
  },
  {
    name: 'Tweet',
    path: '/tweet/:tweet',
    component: PageTweet,
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)*',
    component: PageNotFound,
  },
]
