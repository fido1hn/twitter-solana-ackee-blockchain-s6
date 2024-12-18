<script lang="ts" setup>
import { ref } from 'vue'
import { paginateTweets } from '@/api'
import TweetForm from '@/components/TweetForm.vue'
import TweetList from '@/components/TweetList.vue'

const tweets = ref([])
const onNewPage = (newTweets) => tweets.value.push(...newTweets)
const { prefetch, hasNextPage, getNextPage, loading } = paginateTweets([], 10, onNewPage)
prefetch().then(getNextPage)

const addTweet = (tweet) => tweets.value.push(tweet)
</script>

<template>
  <tweet-form @added="addTweet"></tweet-form>
  <tweet-list
    v-model:tweets="tweets"
    :loading="loading"
    :has-more="hasNextPage"
    @more="getNextPage"
  ></tweet-list>
</template>
