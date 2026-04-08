import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import {
  getComments,
  createComment,
  deleteComment,
  likeComment,
  dislikeComment,
  getReplies,
} from "@/lib/requests";
import { useUserStore } from "@/store/useUserStore";
import { useAppStore } from "@/store/useAppStore";
import { timeAgo } from "@/lib/utils";
import { Brand, Colors, FontSize, Radius, Spacing, Shadow } from "@/constants/theme";
import type { Comment } from "@/types";

interface Props {
  targetId: string;
  targetModel: "News" | "Gallery";
  onLogin?: () => void;
}

export function CommentsSection({ targetId, targetModel, onLogin }: Props) {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const lang = useAppStore((s) => s.language);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, Comment[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getComments(targetModel, targetId, { limit: 50 });
      setComments((res as any).comments ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [targetId, targetModel]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      if (onLogin) onLogin();
      else
        Alert.alert(
          lang === "te" ? "లాగిన్ అవసరం" : "Login Required",
          lang === "te"
            ? "కామెంట్ చేయడానికి లాగిన్ చేయండి"
            : "Please login to comment"
        );
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const parentId = replyTo?._id ?? null;

    // Optimistic: add comment immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      _id: tempId,
      target: targetId,
      targetModel,
      author: user ? { _id: user._id, fullName: user.fullName, avatar: user.avatar } : null,
      text: trimmed,
      language: lang,
      parentComment: parentId,
      likes: [],
      dislikes: [],
      isDeleted: false,
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (parentId) {
      setExpandedReplies((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] ?? []), optimisticComment],
      }));
    } else {
      setComments((prev) => [optimisticComment, ...prev]);
    }

    setText("");
    setReplyTo(null);
    setSubmitting(true);

    try {
      await createComment({
        target: targetId,
        targetModel,
        text: trimmed,
        language: lang,
        ...(parentId ? { parentComment: parentId } : {}),
      });
      // Background sync
      fetchComments();
      if (parentId) loadRepliesFor(parentId);
    } catch {
      // Revert optimistic on error
      if (parentId) {
        setExpandedReplies((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] ?? []).filter((c) => c._id !== tempId),
        }));
      } else {
        setComments((prev) => prev.filter((c) => c._id !== tempId));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAuthenticated) {
      if (onLogin) onLogin();
      return;
    }

    Alert.alert(
      lang === "te" ? "కామెంట్ తొలగించు" : "Delete Comment",
      lang === "te"
        ? "మీరు ఈ కామెంట్‌ను తొలగించాలనుకుంటున్నారా?"
        : "Are you sure you want to delete this comment?",
      [
        { text: lang === "te" ? "రద్దు" : "Cancel", style: "cancel" },
        {
          text: lang === "te" ? "తొలగించు" : "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteComment(id);
              // Remove from local state on success
              setComments((prev) => prev.filter((c) => c._id !== id));
              setExpandedReplies((prev) => {
                const next: Record<string, Comment[]> = {};
                for (const key of Object.keys(prev)) {
                  next[key] = prev[key].filter((c) => c._id !== id);
                }
                return next;
              });
            } catch {
              Alert.alert(
                lang === "te" ? "విఫలమైంది" : "Failed",
                lang === "te"
                  ? "కామెంట్ తొలగించడం విఫలమైంది. మళ్ళీ ప్రయత్నించండి."
                  : "Failed to delete comment. Please try again."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLike = async (id: string) => {
    if (!isAuthenticated) {
      if (onLogin) onLogin();
      return;
    }
    const userId = user?._id;
    if (!userId) return;

    // Optimistic toggle
    const updateComments = (list: Comment[]) =>
      list.map((c) => {
        if (c._id !== id) return c;
        const hasLiked = c.likes?.includes(userId);
        return {
          ...c,
          likes: hasLiked ? c.likes.filter((l) => l !== userId) : [...(c.likes ?? []), userId],
          dislikes: c.dislikes?.filter((d) => d !== userId) ?? [],
        };
      });
    setComments(updateComments);
    setExpandedReplies((prev) => {
      const next: Record<string, Comment[]> = {};
      for (const key of Object.keys(prev)) {
        next[key] = updateComments(prev[key]);
      }
      return next;
    });

    try {
      await likeComment(id);
    } catch {
      fetchComments();
    }
  };

  const handleDislike = async (id: string) => {
    if (!isAuthenticated) {
      if (onLogin) onLogin();
      return;
    }
    const userId = user?._id;
    if (!userId) return;

    // Optimistic toggle
    const updateComments = (list: Comment[]) =>
      list.map((c) => {
        if (c._id !== id) return c;
        const hasDisliked = c.dislikes?.includes(userId);
        return {
          ...c,
          dislikes: hasDisliked ? c.dislikes.filter((d) => d !== userId) : [...(c.dislikes ?? []), userId],
          likes: c.likes?.filter((l) => l !== userId) ?? [],
        };
      });
    setComments(updateComments);
    setExpandedReplies((prev) => {
      const next: Record<string, Comment[]> = {};
      for (const key of Object.keys(prev)) {
        next[key] = updateComments(prev[key]);
      }
      return next;
    });

    try {
      await dislikeComment(id);
    } catch {
      fetchComments();
    }
  };

  const loadRepliesFor = async (commentId: string) => {
    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await getReplies(commentId);
      setExpandedReplies((prev) => ({
        ...prev,
        [commentId]: (res as any).data?.replies ?? [],
      }));
    } catch {
      // ignore
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplies = async (commentId: string) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
      return;
    }
    await loadRepliesFor(commentId);
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?._id === comment.author?._id;
    const likesCount = comment.likes?.length ?? 0;
    const dislikesCount = comment.dislikes?.length ?? 0;
    const hasLiked = user ? comment.likes?.includes(user._id) : false;
    const hasDisliked = user ? comment.dislikes?.includes(user._id) : false;
    const isDeleting = deletingId === comment._id;

    if (comment.isDeleted) return null;

    return (
      <View
        key={comment._id}
        style={[
          styles.commentCard,
          isReply && styles.replyCard,
          isDeleting && styles.commentDeleting,
        ]}
      >
        <View style={styles.commentHeader}>
          {comment.author?.avatar ? (
            <Image
              source={{ uri: comment.author.avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {(comment.author?.fullName ?? "?").charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.commentMeta}>
            <Text style={styles.authorName}>
              {comment.author?.fullName ??
                (lang === "te" ? "అజ్ఞాత" : "Anonymous")}
            </Text>
            <Text style={styles.commentTime}>
              {timeAgo(comment.createdAt, lang)}
            </Text>
          </View>
          {isOwner && !isDeleting && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(comment._id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={15} color={Colors.light.error} />
            </TouchableOpacity>
          )}
          {isDeleting && (
            <ActivityIndicator size="small" color={Colors.light.error} />
          )}
        </View>

        <Text style={styles.commentText}>{comment.text}</Text>

        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleLike(comment._id)}
          >
            <Ionicons
              name={hasLiked ? "heart" : "heart-outline"}
              size={15}
              color={hasLiked ? Brand.primary : Colors.light.textMuted}
            />
            {likesCount > 0 && (
              <Text style={[styles.actionCount, hasLiked && styles.actionCountActive]}>
                {likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleDislike(comment._id)}
          >
            <Ionicons
              name={hasDisliked ? "thumbs-down" : "thumbs-down-outline"}
              size={14}
              color={hasDisliked ? Colors.light.error : Colors.light.textMuted}
            />
            {dislikesCount > 0 && (
              <Text style={styles.actionCount}>{dislikesCount}</Text>
            )}
          </TouchableOpacity>

          {!isReply && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setReplyTo(comment)}
            >
              <Ionicons name="chatbubble-outline" size={14} color={Colors.light.textMuted} />
              <Text style={styles.actionText}>
                {lang === "te" ? "రిప్లై" : "Reply"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Replies toggle */}
        {!isReply && !comment.parentComment && (
          <>
            <TouchableOpacity
              style={styles.repliesToggle}
              onPress={() => toggleReplies(comment._id)}
            >
              {loadingReplies[comment._id] ? (
                <ActivityIndicator size="small" color={Brand.primary} />
              ) : (
                <View style={styles.repliesToggleInner}>
                  <Ionicons
                    name={expandedReplies[comment._id] ? "chevron-up" : "chevron-down"}
                    size={14}
                    color={Brand.primary}
                  />
                  <Text style={styles.repliesToggleText}>
                    {expandedReplies[comment._id]
                      ? lang === "te"
                        ? "రిప్లైలు దాచు"
                        : "Hide replies"
                      : lang === "te"
                      ? "రిప్లైలు చూడు"
                      : "View replies"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {expandedReplies[comment._id]?.map((reply) =>
              renderComment(reply, true)
            )}
          </>
        )}
      </View>
    );
  };

  const topLevelComments = comments.filter((c) => !c.parentComment && !c.isDeleted);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="chatbubbles" size={20} color={Brand.primary} />
        <Text style={styles.sectionTitle}>
          {lang === "te" ? "వ్యాఖ్యలు" : "Comments"}
        </Text>
        {topLevelComments.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{topLevelComments.length}</Text>
          </View>
        )}
      </View>

      {/* Comment Input */}
      <View style={styles.inputSection}>
        {replyTo && (
          <View style={styles.replyIndicator}>
            <Ionicons name="return-down-forward" size={14} color={Brand.primary} />
            <Text style={styles.replyIndicatorText} numberOfLines={1}>
              {lang === "te" ? "రిప్లై: " : "Replying to "}
              <Text style={styles.replyName}>
                {replyTo.author?.fullName ?? "user"}
              </Text>
            </Text>
            <TouchableOpacity
              onPress={() => setReplyTo(null)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          {isAuthenticated && user?.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.inputAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.inputAvatar, styles.inputAvatarPlaceholder]}>
              <Ionicons name="person" size={14} color={Brand.primary} />
            </View>
          )}
          <TextInput
            style={styles.commentInput}
            placeholder={
              isAuthenticated
                ? lang === "te"
                  ? "మీ వ్యాఖ్యను రాయండి..."
                  : "Write a comment..."
                : lang === "te"
                ? "కామెంట్ చేయడానికి లాగిన్ చేయండి"
                : "Login to comment"
            }
            placeholderTextColor={Colors.light.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            editable={isAuthenticated}
            onFocus={() => {
              if (!isAuthenticated && onLogin) onLogin();
            }}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={handleSubmit}
            disabled={!text.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Brand.primary} />
          <Text style={styles.loadingText}>
            {lang === "te" ? "లోడ్ అవుతోంది..." : "Loading..."}
          </Text>
        </View>
      ) : topLevelComments.length === 0 ? (
        <View style={styles.emptyComments}>
          <Ionicons name="chatbubbles-outline" size={44} color={Colors.light.border} />
          <Text style={styles.emptyTitle}>
            {lang === "te" ? "ఇంకా వ్యాఖ్యలు లేవు" : "No comments yet"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {lang === "te"
              ? "మొదటివారు అవ్వండి!"
              : "Be the first to share your thoughts!"}
          </Text>
        </View>
      ) : (
        <View style={styles.commentsList}>
          {topLevelComments.map((comment) => renderComment(comment))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
  },
  countBadge: {
    backgroundColor: Brand.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#fff",
  },

  // Input
  inputSection: {
    marginBottom: Spacing.lg,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Brand.primary + "0D",
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
  },
  replyIndicatorText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  replyName: {
    fontWeight: "700",
    color: Brand.primary,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-end",
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 5,
  },
  inputAvatarPlaceholder: {
    backgroundColor: Brand.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    textAlignVertical: "top",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  sendBtnDisabled: {
    opacity: 0.35,
  },

  // Comments list
  loadingWrap: {
    paddingVertical: Spacing.xxl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    textAlign: "center",
  },
  commentsList: {
    gap: Spacing.sm,
  },

  // Comment card
  commentCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  replyCard: {
    marginLeft: Spacing.xxl,
    marginTop: Spacing.sm,
    backgroundColor: Colors.light.borderLight,
    ...Shadow.sm,
    shadowOpacity: 0.03,
  },
  commentDeleting: {
    opacity: 0.5,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: Brand.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Brand.primary,
  },
  commentMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.light.text,
  },
  commentTime: {
    fontSize: 10,
    color: Colors.light.textMuted,
    marginTop: 1,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.error + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  commentText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  commentActions: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  actionCount: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
    fontWeight: "600",
  },
  actionCountActive: {
    color: Brand.primary,
  },
  actionText: {
    fontSize: FontSize.xs,
    color: Colors.light.textMuted,
    fontWeight: "600",
  },
  repliesToggle: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
  },
  repliesToggleInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repliesToggleText: {
    fontSize: FontSize.sm,
    color: Brand.primary,
    fontWeight: "600",
  },
});
