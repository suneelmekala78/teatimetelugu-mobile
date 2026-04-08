import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
  useWindowDimensions,
  PanResponder,
  Animated,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { Brand, Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { Comment } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  targetId: string;
  targetModel: "News" | "Gallery";
  onLogin?: () => void;
}

export function CommentsBottomSheet({
  visible,
  onClose,
  targetId,
  targetModel,
  onLogin,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const lang = useAppStore((s) => s.language);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, Comment[]>
  >({});
  const [loadingReplies, setLoadingReplies] = useState<
    Record<string, boolean>
  >({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const translateY = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8,
      onPanResponderGrant: () => {
        Keyboard.dismiss();
      },
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) {
          Keyboard.dismiss();
          onClose();
          translateY.setValue(0);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const fetchComments = useCallback(async () => {
    if (!targetId) return;
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
    if (visible && targetId) {
      fetchComments();
      translateY.setValue(0);
    }
    if (!visible) setKeyboardHeight(0);
  }, [visible, targetId, fetchComments]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const onShow = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { onShow.remove(); onHide.remove(); };
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      if (onLogin) onLogin();
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
      // Background sync to get real data
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

  const handleDelete = (id: string) => {
    Alert.alert(
      lang === "te" ? "కామెంట్ తొలగించు" : "Delete Comment",
      lang === "te"
        ? "మీరు ఈ కామెంట్\u200Cను తొలగించాలనుకుంటున్నారా?"
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
              setComments((prev) => prev.filter((c) => c._id !== id));
              setExpandedReplies((prev) => {
                const next: Record<string, Comment[]> = {};
                for (const key of Object.keys(prev)) {
                  next[key] = prev[key].filter((c) => c._id !== id);
                }
                return next;
              });
            } catch {
              // silently fail
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
    } catch {}
    finally {
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

  const topLevelComments = comments.filter(
    (c) => !c.parentComment && !c.isDeleted
  );

  const renderComment = ({ item: comment }: { item: Comment }) => {
    const isOwner = user?._id === comment.author?._id;
    const likesCount = comment.likes?.length ?? 0;
    const dislikesCount = comment.dislikes?.length ?? 0;
    const hasLiked = user ? comment.likes?.includes(user._id) : false;
    const hasDisliked = user ? comment.dislikes?.includes(user._id) : false;
    const isDeleting = deletingId === comment._id;

    if (comment.isDeleted) return null;

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentRow}>
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
          <View style={styles.commentBody}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>
                {comment.author?.fullName ??
                  (lang === "te" ? "అజ్ఞాత" : "Anonymous")}
              </Text>
              <Text style={styles.commentTime}>
                {timeAgo(comment.createdAt, lang)}
              </Text>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>

            <View style={styles.commentActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleLike(comment._id)}
              >
                <Ionicons
                  name={hasLiked ? "heart" : "heart-outline"}
                  size={14}
                  color={hasLiked ? Brand.primary : Colors.light.textMuted}
                />
                {likesCount > 0 && (
                  <Text style={styles.actionCount}>{likesCount}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => handleDislike(comment._id)}
              >
                <Ionicons
                  name={hasDisliked ? "thumbs-down" : "thumbs-down-outline"}
                  size={13}
                  color={
                    hasDisliked ? Colors.light.error : Colors.light.textMuted
                  }
                />
                {dislikesCount > 0 && (
                  <Text style={styles.actionCount}>{dislikesCount}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setReplyTo(comment)}
              >
                <Text style={styles.replyBtn}>
                  {lang === "te" ? "రిప్లై" : "Reply"}
                </Text>
              </TouchableOpacity>

              {isOwner && !isDeleting && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(comment._id)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={13}
                    color={Colors.light.error}
                  />
                </TouchableOpacity>
              )}
              {isDeleting && (
                <ActivityIndicator size="small" color={Colors.light.error} />
              )}
            </View>

            {/* Replies toggle */}
            {!comment.parentComment && (
              <>
                <TouchableOpacity
                  style={styles.repliesToggle}
                  onPress={() => toggleReplies(comment._id)}
                >
                  {loadingReplies[comment._id] ? (
                    <ActivityIndicator size="small" color={Brand.primary} />
                  ) : (
                    <Text style={styles.repliesToggleText}>
                      {expandedReplies[comment._id]
                        ? lang === "te"
                          ? "━ రిప్లైలు దాచు"
                          : "━ Hide replies"
                        : lang === "te"
                        ? "━ రిప్లైలు చూడు"
                        : "━ View replies"}
                    </Text>
                  )}
                </TouchableOpacity>
                {expandedReplies[comment._id]?.map((reply) => {
                  if (reply.isDeleted) return null;
                  const rIsOwner = user?._id === reply.author?._id;
                  const rLikes = reply.likes?.length ?? 0;
                  const rHasLiked = user
                    ? reply.likes?.includes(user._id)
                    : false;
                  return (
                    <View key={reply._id} style={styles.replyCard}>
                      {reply.author?.avatar ? (
                        <Image
                          source={{ uri: reply.author.avatar }}
                          style={styles.replyAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View
                          style={[
                            styles.replyAvatar,
                            styles.avatarPlaceholder,
                          ]}
                        >
                          <Text style={styles.avatarInitialSmall}>
                            {(reply.author?.fullName ?? "?")
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.commentBody}>
                        <View style={styles.nameRow}>
                          <Text style={styles.authorNameSmall}>
                            {reply.author?.fullName ?? "Anonymous"}
                          </Text>
                          <Text style={styles.commentTime}>
                            {timeAgo(reply.createdAt, lang)}
                          </Text>
                        </View>
                        <Text style={styles.commentTextSmall}>
                          {reply.text}
                        </Text>
                        <View style={styles.commentActions}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleLike(reply._id)}
                          >
                            <Ionicons
                              name={rHasLiked ? "heart" : "heart-outline"}
                              size={12}
                              color={
                                rHasLiked
                                  ? Brand.primary
                                  : Colors.light.textMuted
                              }
                            />
                            {rLikes > 0 && (
                              <Text style={styles.actionCount}>{rLikes}</Text>
                            )}
                          </TouchableOpacity>
                          {rIsOwner && (
                            <TouchableOpacity
                              style={styles.actionBtn}
                              onPress={() => handleDelete(reply._id)}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={12}
                                color={Colors.light.error}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: keyboardHeight > 0 ? keyboardHeight : (insets.bottom || Spacing.md),
                maxHeight: keyboardHeight > 0 ? SCREEN_HEIGHT - keyboardHeight - insets.top : SHEET_HEIGHT,
                minHeight: keyboardHeight > 0 ? undefined : SHEET_HEIGHT,
              },
              { transform: [{ translateY }] },
            ]}
          >
            {/* Drag handle + header */}
            <View {...panResponder.panHandlers}>
              <View style={styles.dragHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {lang === "te" ? "వ్యాఖ్యలు" : "Comments"}
                  {topLevelComments.length > 0 &&
                    ` (${topLevelComments.length})`}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={Colors.light.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments list */}
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="small" color={Brand.primary} />
              </View>
            ) : topLevelComments.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={44}
                  color={Colors.light.border}
                />
                <Text style={styles.emptyText}>
                  {lang === "te"
                    ? "ఇంకా వ్యాఖ్యలు లేవు"
                    : "No comments yet"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={topLevelComments}
                keyExtractor={(c) => c._id}
                renderItem={renderComment}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              />
            )}

            {/* Input bar */}
            <View style={styles.inputBar}>
              {replyTo && (
                <View style={styles.replyIndicator}>
                  <Text style={styles.replyText} numberOfLines={1}>
                    {lang === "te" ? "రిప్లై: " : "Replying to "}
                    <Text style={styles.replyName}>
                      {replyTo.author?.fullName ?? "user"}
                    </Text>
                  </Text>
                  <TouchableOpacity onPress={() => setReplyTo(null)}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={Colors.light.textMuted}
                    />
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
                  <View
                    style={[styles.inputAvatar, styles.inputAvatarPlaceholder]}
                  >
                    <Ionicons name="person" size={12} color={Brand.primary} />
                  </View>
                )}
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder={
                    isAuthenticated
                      ? lang === "te"
                        ? "వ్యాఖ్యను రాయండి..."
                        : "Add a comment..."
                      : lang === "te"
                      ? "లాగిన్ చేయండి"
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
                  style={[
                    styles.sendBtn,
                    (!text.trim() || submitting) && styles.sendBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!text.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,

  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.light.text,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.light.textMuted,
    marginTop: Spacing.sm,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // Comment card
  commentCard: { marginBottom: Spacing.md },
  commentRow: { flexDirection: "row", gap: Spacing.sm },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarPlaceholder: {
    backgroundColor: Brand.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 13, fontWeight: "700", color: Brand.primary },
  commentBody: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.light.text,
  },
  commentTime: { fontSize: 10, color: Colors.light.textMuted },
  commentText: {
    fontSize: FontSize.sm,
    color: Colors.light.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  actionCount: { fontSize: 11, color: Colors.light.textMuted },
  replyBtn: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.light.textMuted,
  },

  // Replies
  repliesToggle: { marginTop: 4, marginBottom: 4 },
  repliesToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: Brand.primary,
  },
  replyCard: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
    marginTop: Spacing.sm,
  },
  replyAvatar: { width: 24, height: 24, borderRadius: 12 },
  avatarInitialSmall: {
    fontSize: 10,
    fontWeight: "700",
    color: Brand.primary,
  },
  authorNameSmall: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
  },
  commentTextSmall: {
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 16,
    marginBottom: 2,
  },

  // Input bar
  inputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.xs,
  },
  replyText: { fontSize: 12, color: Colors.light.textSecondary },
  replyName: { fontWeight: "700", color: Brand.primary },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: Spacing.sm },
  inputAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 2 },
  inputAvatarPlaceholder: {
    backgroundColor: Brand.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.light.text,
    maxHeight: 80,
    paddingVertical: Spacing.sm,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
