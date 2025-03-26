import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - 40; // -40 for padding
const KNOB_SIZE = 20;

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step,
  value,
  onChange,
}) => {
  const [sliderWidth, setSliderWidth] = useState(SLIDER_WIDTH);
  const position = useSharedValue(((value - min) / (max - min)) * sliderWidth);

  useEffect(() => {
    position.value = ((value - min) / (max - min)) * sliderWidth;
  }, [value, sliderWidth, min, max]);

  const updateValue = (pos: number) => {
    "worklet";
    const ratio = pos / sliderWidth;
    let newValue = min + ratio * (max - min);

    // Round to nearest step
    if (step > 0) {
      newValue = Math.round(newValue / step) * step;
    }

    // Ensure within range
    newValue = Math.max(min, Math.min(max, newValue));

    runOnJS(onChange)(newValue);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      const newPosition = Math.max(
        0,
        Math.min(sliderWidth, gestureState.moveX - 20)
      ); // 20 is container padding
      position.value = newPosition;
      updateValue(newPosition);
    },
    onPanResponderRelease: () => {
      // Optional spring animation when released
      position.value = withSpring(position.value);
    },
  });

  const knobStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: position.value }],
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: position.value + KNOB_SIZE / 2,
    };
  });

  const onLayout = (event: { nativeEvent: { layout: { width: number } } }) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width - KNOB_SIZE);
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.trackContainer} {...panResponder.panHandlers}>
        <View style={styles.track} />
        <Animated.View style={[styles.progress, progressStyle]} />
        <Animated.View style={[styles.knob, knobStyle]} />
      </View>
      <View style={styles.labelsContainer}>
        <Text style={styles.label}>{min}</Text>
        <Text style={styles.label}>{max}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  trackContainer: {
    height: KNOB_SIZE,
    justifyContent: "center",
  },
  track: {
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  progress: {
    height: 4,
    backgroundColor: "#0286FF",
    borderRadius: 2,
    position: "absolute",
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#0286FF",
    position: "absolute",
    transform: [{ translateX: 0 }],
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  labelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontFamily: "Poppins-Regular",
    color: "#666",
    fontSize: 12,
  },
});

export default RangeSlider;
