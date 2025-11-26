/**
 * Attribution Engine Examples
 *
 * Demonstrates how to use the attribution engine with real-world scenarios.
 * Run this file to test the attribution logic.
 */

import { AttributionEngine } from './engine';
import type { RawContent, Project, ProjectSocialLink } from './types';

/**
 * Example: Multi-brand creator with $WOLF and $BIRDIE tokens
 */
async function exampleMultiBrandCreator() {
  console.log('=== EXAMPLE: Multi-Brand Creator ===\n');

  // Create attribution engine
  const engine = new AttributionEngine();

  // Define creator's projects
  const projects: Project[] = [
    {
      id: 'project-wolf',
      userId: 'user-123',
      name: 'Wolf Token',
      tokenSymbol: 'WOLF',
      tokenAddress: '7ctK21VZ...pump',
      blockchain: 'solana',
      isPrimary: true,
      keywords: ['$WOLF', '#WOLF', '#WolfToken', 'wolf token'],
      socialLinks: [],
    },
    {
      id: 'project-birdie',
      userId: 'user-123',
      name: 'Birdie',
      tokenSymbol: 'BIRDIE',
      tokenAddress: 'BWExg398...pump',
      blockchain: 'solana',
      isPrimary: false,
      keywords: ['$BIRDIE', '#BIRDIE', '#BirdieGang', 'birdie'],
      socialLinks: [],
    },
  ];

  // Define social account links
  const socialLinks: ProjectSocialLink[] = [
    // Twitter account linked to both projects (mentions_only mode)
    {
      projectId: 'project-wolf',
      socialAccountId: 'social-twitter-1',
      platform: 'twitter',
      platformUserId: 'twitter-123',
      username: '@wolfcreator',
      attributionMode: 'mentions_only',
    },
    {
      projectId: 'project-birdie',
      socialAccountId: 'social-twitter-1',
      platform: 'twitter',
      platformUserId: 'twitter-123',
      username: '@wolfcreator',
      attributionMode: 'mentions_only',
    },
    // Pump.fun account (only for WOLF)
    {
      projectId: 'project-wolf',
      socialAccountId: 'social-pumpfun-1',
      platform: 'pumpfun',
      platformUserId: 'pumpfun-456',
      username: 'wolfcreator.pumpfun',
      attributionMode: 'broadcast', // Not used - pump.fun auto-attributes
    },
  ];

  // Test Case 1: Tweet with $WOLF cashtag
  console.log('Test 1: Tweet with $WOLF cashtag');
  const tweet1: RawContent = {
    contentId: 'tweet-1',
    platform: 'twitter',
    contentType: 'tweet',
    text: 'Just bought more $WOLF! LFG 🚀',
    url: 'https://twitter.com/wolfcreator/status/123',
    postedAt: new Date(),
    authorId: 'twitter-123',
    authorUsername: '@wolfcreator',
    likes: 42,
    retweets: 12,
  };

  const result1 = await engine.attributeContent(tweet1, projects, socialLinks);
  console.log('Attributions:', result1);
  console.log('Expected: $WOLF (100% - cashtag)\n');

  // Test Case 2: Tweet with both $WOLF and $BIRDIE
  console.log('Test 2: Tweet with both $WOLF and $BIRDIE');
  const tweet2: RawContent = {
    contentId: 'tweet-2',
    platform: 'twitter',
    contentType: 'tweet',
    text: 'New merch for $WOLF holders! Also announcing $BIRDIE art reveal tomorrow',
    url: 'https://twitter.com/wolfcreator/status/124',
    postedAt: new Date(),
    authorId: 'twitter-123',
    authorUsername: '@wolfcreator',
    likes: 156,
    retweets: 45,
  };

  const result2 = await engine.attributeContent(tweet2, projects, socialLinks);
  console.log('Attributions:', result2);
  console.log('Expected: $WOLF (100% - cashtag), $BIRDIE (100% - cashtag)\n');

  // Test Case 3: Tweet with only hashtag
  console.log('Test 3: Tweet with #WolfToken hashtag');
  const tweet3: RawContent = {
    contentId: 'tweet-3',
    platform: 'twitter',
    contentType: 'tweet',
    text: 'Big announcement for #WolfToken community tomorrow! 🐺',
    url: 'https://twitter.com/wolfcreator/status/125',
    postedAt: new Date(),
    authorId: 'twitter-123',
    authorUsername: '@wolfcreator',
    likes: 89,
    retweets: 23,
  };

  const result3 = await engine.attributeContent(tweet3, projects, socialLinks);
  console.log('Attributions:', result3);
  console.log('Expected: $WOLF (90% - hashtag)\n');

  // Test Case 4: Tweet without tags (should be 50% - manual review)
  console.log('Test 4: Tweet without cashtag/hashtag');
  const tweet4: RawContent = {
    contentId: 'tweet-4',
    platform: 'twitter',
    contentType: 'tweet',
    text: 'So excited about my wolf token project! Big things coming',
    url: 'https://twitter.com/wolfcreator/status/126',
    postedAt: new Date(),
    authorId: 'twitter-123',
    authorUsername: '@wolfcreator',
    likes: 34,
    retweets: 8,
  };

  const result4 = await engine.attributeContent(tweet4, projects, socialLinks);
  console.log('Attributions:', result4);
  console.log('Expected: $WOLF (50% - project name mention, manual review)\n');

  // Test Case 5: Generic tweet (should be 0% - ignored)
  console.log('Test 5: Generic tweet without any signals');
  const tweet5: RawContent = {
    contentId: 'tweet-5',
    platform: 'twitter',
    contentType: 'tweet',
    text: 'I saw a wolf at the zoo today, so cool! 🐺',
    url: 'https://twitter.com/wolfcreator/status/127',
    postedAt: new Date(),
    authorId: 'twitter-123',
    authorUsername: '@wolfcreator',
    likes: 12,
    retweets: 2,
  };

  const result5 = await engine.attributeContent(tweet5, projects, socialLinks);
  console.log('Attributions:', result5);
  console.log('Expected: None (0% - no signals, completely ignored)\n');

  // Test Case 6: Pump.fun stream (100% automatic)
  console.log('Test 6: Pump.fun stream (automatic attribution)');
  const stream1: RawContent = {
    contentId: 'stream-1',
    platform: 'pumpfun',
    contentType: 'stream',
    text: 'Just chatting with the community',
    url: 'https://pump.fun/stream/123',
    postedAt: new Date(),
    authorId: 'pumpfun-456',
    authorUsername: 'wolfcreator.pumpfun',
    views: 1234,
  };

  const result6 = await engine.attributeContent(stream1, projects, socialLinks);
  console.log('Attributions:', result6);
  console.log('Expected: $WOLF (100% - pumpfun_stream, platform rule)\n');
}

/**
 * Example: Zora creator with creator coin and content coins
 */
async function exampleZoraCreator() {
  console.log('\n=== EXAMPLE: Zora Creator with Content Coins ===\n');

  const engine = new AttributionEngine();

  // Zora creator project
  const projects: Project[] = [
    {
      id: 'project-birdie-creator',
      userId: 'user-456',
      name: 'Birdie Creator Coin',
      tokenSymbol: 'BIRDIE-CREATOR',
      tokenAddress: 'zora-creator-123',
      blockchain: 'zora',
      isPrimary: true,
      keywords: ['$BIRDIE', '#Birdie'],
      socialLinks: [],
    },
    {
      id: 'project-summer-track',
      userId: 'user-456',
      name: 'Summer Track',
      tokenSymbol: 'SUMMER-TRACK',
      tokenAddress: 'zora-content-456',
      blockchain: 'zora',
      isPrimary: false,
      keywords: ['Summer Track', 'summer track'],
      socialLinks: [],
    },
  ];

  const socialLinks: ProjectSocialLink[] = [
    {
      projectId: 'project-birdie-creator',
      socialAccountId: 'social-zora-1',
      platform: 'zora',
      platformUserId: 'zora-789',
      username: 'birdie.zora',
      attributionMode: 'broadcast',
    },
    {
      projectId: 'project-summer-track',
      socialAccountId: 'social-zora-1',
      platform: 'zora',
      platformUserId: 'zora-789',
      username: 'birdie.zora',
      attributionMode: 'mentions_only',
    },
  ];

  // Test: Zora stream mentioning content
  console.log('Test: Zora stream mentioning "Summer Track" in title');
  const stream: RawContent = {
    contentId: 'zora-stream-1',
    platform: 'zora',
    contentType: 'stream',
    text: 'Playing my Summer Track remix tonight! 🎵',
    url: 'https://zora.co/stream/123',
    postedAt: new Date(),
    authorId: 'zora-789',
    authorUsername: 'birdie.zora',
    views: 567,
  };

  const result = await engine.attributeContent(stream, projects, socialLinks);
  console.log('Attributions:', result);
  console.log('Expected:');
  console.log('  - Birdie Creator Coin (100% - zora_creator_stream)');
  console.log('  - Summer Track (75% - zora_content_match)\n');
}

/**
 * Example: Broadcast mode (all content attributed)
 */
async function exampleBroadcastMode() {
  console.log('\n=== EXAMPLE: Broadcast Mode ===\n');

  const engine = new AttributionEngine();

  const projects: Project[] = [
    {
      id: 'project-dtv',
      userId: 'user-789',
      name: 'DraperTV',
      tokenSymbol: 'DTV',
      tokenAddress: 'dtv-address-123',
      blockchain: 'solana',
      isPrimary: true,
      keywords: ['$DTV', '#DTV', '#DraperTV'],
      socialLinks: [],
    },
  ];

  // Twitter account in BROADCAST mode
  const socialLinks: ProjectSocialLink[] = [
    {
      projectId: 'project-dtv',
      socialAccountId: 'social-twitter-dtv',
      platform: 'twitter',
      platformUserId: 'twitter-dtv-123',
      username: '@drapertv',
      attributionMode: 'broadcast', // All tweets = DTV
    },
  ];

  // Test: Generic tweet (normally 0%, but broadcast mode = 100%)
  console.log('Test: Generic tweet in broadcast mode');
  const tweet: RawContent = {
    contentId: 'tweet-dtv-1',
    platform: 'twitter',
    contentType: 'tweet',
    text: 'Good morning everyone! Ready for a great day 🌅',
    url: 'https://twitter.com/drapertv/status/200',
    postedAt: new Date(),
    authorId: 'twitter-dtv-123',
    authorUsername: '@drapertv',
    likes: 234,
    retweets: 56,
  };

  const result = await engine.attributeContent(tweet, projects, socialLinks);
  console.log('Attributions:', result);
  console.log('Expected: $DTV (100% - broadcast mode)\n');
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    await exampleMultiBrandCreator();
    await exampleZoraCreator();
    await exampleBroadcastMode();

    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Export for use in tests
export {
  exampleMultiBrandCreator,
  exampleZoraCreator,
  exampleBroadcastMode,
  runAllExamples,
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
