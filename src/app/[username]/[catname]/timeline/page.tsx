import Image from "next/image";
import { notFound } from "next/navigation";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, cats, timelinePosts, dailyCheckins } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { ProfileTabs } from "@/components/cat/profile-tabs";
import { PostForm } from "@/components/timeline/post-form";
import { DeletePostButton } from "@/components/timeline/delete-post-button";
import { VideoPlayer } from "@/components/timeline/video-player";
import { DailyCheckinForm } from "@/components/checkin/daily-checkin-form";
import { CheckinSummary } from "@/components/checkin/checkin-summary";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ username: string; catname: string }>;
}) {
  const { username, catname } = await params;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) notFound();

  const [cat] = await db
    .select()
    .from(cats)
    .where(and(eq(cats.ownerId, user.id), eq(cats.slug, catname)))
    .limit(1);

  if (!cat) notFound();

  const session = await auth();
  const isOwner = session?.user?.id === user.id;
  if (!cat.isPublic && !isOwner) notFound();

  // Fetch today's check-in
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayCheckin] = await db
    .select()
    .from(dailyCheckins)
    .where(
      and(eq(dailyCheckins.catId, cat.id), eq(dailyCheckins.date, today))
    )
    .limit(1);

  const posts = await db
    .select()
    .from(timelinePosts)
    .where(eq(timelinePosts.catId, cat.id))
    .orderBy(desc(timelinePosts.createdAt));

  return (
    <div className="max-w-5xl mx-auto w-full px-6 md:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-4xl mb-1">{cat.name}</h1>
        <p className="text-muted-foreground">
          @{username}/{cat.slug} — Timeline
        </p>
      </div>

      <ProfileTabs username={username} catname={catname} />

      {/* Daily Check-in Section (owner only) */}
      {isOwner && (
        <div className="mb-6">
          {todayCheckin ? (
            <CheckinSummary checkin={todayCheckin} />
          ) : (
            <DailyCheckinForm catId={cat.id} />
          )}
        </div>
      )}

      {isOwner && <PostForm catId={cat.id} />}

      {posts.length === 0 ? (
        <div className="bg-card p-8 text-center">
          <p className="text-muted-foreground">
            No posts yet.
            {isOwner && " Share what your cat is up to!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="bg-card p-5 shadow-golden">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 bg-sunshine-300/30 flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {cat.avatarUrl ? (
                      <Image
                        src={cat.avatarUrl}
                        alt={cat.name}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      "🐱"
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(post.createdAt)}
                    </span>
                    {post.isHealthAlert && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-600 dark:text-red-400 uppercase tracking-wider">
                        🚨 Health Alert
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && <DeletePostButton postId={post.id} />}
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="relative mt-3 max-h-96 overflow-hidden">
                  <Image
                    src={post.imageUrl}
                    alt="Post image"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {post.videoUrl && (
                <div className="mt-3">
                  <VideoPlayer src={post.videoUrl} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
