import { useRef, useState, useEffect } from "react";
import { Keyboard, Platform, KeyboardEvent } from "react-native";
import { debounce } from "lodash";

interface ScrollBehaviorProps {
  isFirstLoad: boolean;
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
}

export const useScrollBehavior = ({
  isFirstLoad,
  onKeyboardShow,
  onKeyboardHide,
}: ScrollBehaviorProps) => {
  const [userScrolled, setUserScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollPositionRef = useRef(0);
  const isKeyboardVisibleRef = useRef(false);

  const debouncedShowScrollButton = debounce((shouldShow: boolean) => {
    setShowScrollToBottom(shouldShow);
  }, 300);

  useEffect(() => {
    const keyboardWillShow = (e: KeyboardEvent) => {
      isKeyboardVisibleRef.current = true;
      setKeyboardHeight(e.endCoordinates.height);
      onKeyboardShow?.();
    };

    const keyboardWillHide = () => {
      isKeyboardVisibleRef.current = false;
      setKeyboardHeight(0);
      onKeyboardHide?.();
    };

    const keyboardDidShow = (e: KeyboardEvent) => {
      isKeyboardVisibleRef.current = true;
      setKeyboardHeight(e.endCoordinates.height);
      onKeyboardShow?.();
    };

    const keyboardDidHide = () => {
      isKeyboardVisibleRef.current = false;
      setKeyboardHeight(0);
      onKeyboardHide?.();
    };

    let showSubscription: any;
    let hideSubscription: any;

    if (Platform.OS === "ios") {
      showSubscription = Keyboard.addListener(
        "keyboardWillShow",
        keyboardWillShow
      );
      hideSubscription = Keyboard.addListener(
        "keyboardWillHide",
        keyboardWillHide
      );
    } else {
      showSubscription = Keyboard.addListener(
        "keyboardDidShow",
        keyboardDidShow
      );
      hideSubscription = Keyboard.addListener(
        "keyboardDidHide",
        keyboardDidHide
      );
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      debouncedShowScrollButton.cancel();
    };
  }, [onKeyboardShow, onKeyboardHide]);

  const handleScroll = (event: any) => {
    const currentScrollPosition = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
    const distanceFromBottom =
      contentHeight - currentScrollPosition - scrollViewHeight;

    scrollPositionRef.current = currentScrollPosition;

    if (distanceFromBottom > 20) {
      setUserScrolled(true);
      if (distanceFromBottom > 150) {
        debouncedShowScrollButton(true);
      }
    } else {
      setUserScrolled(false);
      debouncedShowScrollButton(false);
    }
  };

  const resetScrollState = () => {
    setUserScrolled(false);
    setShowScrollToBottom(false);
  };

  return {
    userScrolled,
    showScrollToBottom,
    keyboardHeight,
    isKeyboardVisible: isKeyboardVisibleRef.current,
    scrollPosition: scrollPositionRef.current,
    handleScroll,
    resetScrollState,
    debouncedShowScrollButton,
  };
};
