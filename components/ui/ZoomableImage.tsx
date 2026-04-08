import React from "react";
import { useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";

interface Props {
  uri: string;
}

export function ZoomableImage({ uri }: Props) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), 5);
    })
    .onEnd(() => {
      if (scale.value < 1.1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((e, state) => {
      // Only activate pan when zoomed in; otherwise let FlatList handle swipes
      if (scale.value > 1) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(2.5);
        savedScale.value = 2.5;
      }
    });

  // Pan only activates when zoomed; at normal scale, gestures pass through to FlatList
  const zoomGestures = Gesture.Simultaneous(pinchGesture, panGesture);
  const composed = Gesture.Race(doubleTap, zoomGestures);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 }, animatedStyle]}>
          <Image
            source={{ uri }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 }}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
