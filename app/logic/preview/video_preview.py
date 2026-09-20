import os
import sys
import time
import ctypes
import vlc
import customtkinter as ctk


class VideoPlayer:

    def __init__(self, file_path, parent):

        self.file_path = file_path
        self.parent = parent

        # =================================================
        # VLC
        # =================================================

        self.instance = None
        self.player = None

        # =================================================
        # PLAYER STATE
        # =================================================

        self.playing = False
        self.duration = 0
        self.is_seeking = False

        self.after_id = None

        # =================================================
        # PLAYBACK SPEED
        # =================================================

        self.playback_speed = 1.0

        # =================================================
        # CREATE UI
        # =================================================

        self.create_player()

        # =================================================
        # INITIALIZE VLC
        # =================================================

        self.initialize_vlc()


    # =====================================================
    # CREATE PLAYER UI
    # =====================================================

    def create_player(self):

        self.container = ctk.CTkFrame(
            self.parent,
            fg_color="#FFFFFF",
            corner_radius=0
        )

        self.container.pack(
            fill="both",
            expand=True
        )


        # =================================================
        # VIDEO AREA
        # =================================================

        self.video_frame = ctk.CTkFrame(
            self.container,
            fg_color="#111111",
            corner_radius=8
        )

        self.video_frame.pack(
            fill="both",
            expand=True,
            padx=20,
            pady=(20, 10)
        )


        self.video_placeholder = ctk.CTkLabel(
            self.video_frame,
            text=""
        )

        self.video_placeholder.pack(
            fill="both",
            expand=True
        )


        # =================================================
        # TIME
        # =================================================

        self.time_frame = ctk.CTkFrame(
            self.container,
            fg_color="transparent"
        )

        self.time_frame.pack(
            fill="x",
            padx=25
        )


        self.current_time_label = ctk.CTkLabel(
            self.time_frame,
            text="00:00",
            font=ctk.CTkFont(
                size=12
            ),
            text_color="#555555"
        )

        self.current_time_label.pack(
            side="left"
        )


        self.duration_label = ctk.CTkLabel(
            self.time_frame,
            text="00:00",
            font=ctk.CTkFont(
                size=12
            ),
            text_color="#555555"
        )

        self.duration_label.pack(
            side="right"
        )


        # =================================================
        # TIMELINE
        # =================================================

        self.timeline = ctk.CTkSlider(
            self.container,
            from_=0,
            to=1,
            command=self.on_timeline_move
        )

        self.timeline.pack(
            fill="x",
            padx=25,
            pady=(2, 10)
        )

        self.timeline.set(0)


        # =================================================
        # CONTROLS
        # =================================================

        self.controls = ctk.CTkFrame(
            self.container,
            fg_color="transparent"
        )

        self.controls.pack(
            pady=(0, 15)
        )


        # -------------------------------------------------
        # PLAY / PAUSE
        # -------------------------------------------------

        self.play_button = ctk.CTkButton(
            self.controls,
            text="▶ Play",
            width=100,
            height=35,
            command=self.toggle_play
        )

        self.play_button.pack(
            side="left",
            padx=5
        )


        # -------------------------------------------------
        # STOP
        # -------------------------------------------------

        self.stop_button = ctk.CTkButton(
            self.controls,
            text="■ Stop",
            width=90,
            height=35,
            fg_color="#DC2626",
            hover_color="#B91C1C",
            command=self.stop
        )

        self.stop_button.pack(
            side="left",
            padx=5
        )


        # -------------------------------------------------
        # VOLUME
        # -------------------------------------------------

        self.volume_label = ctk.CTkLabel(
            self.controls,
            text="🔊",
            font=ctk.CTkFont(
                size=16
            )
        )

        self.volume_label.pack(
            side="left",
            padx=(20, 3)
        )


        self.volume_slider = ctk.CTkSlider(
            self.controls,
            from_=0,
            to=100,
            width=120,
            command=self.change_volume
        )

        self.volume_slider.pack(
            side="left",
            padx=5
        )

        self.volume_slider.set(80)


        # -------------------------------------------------
        # SPEED LABEL
        # -------------------------------------------------

        self.speed_label = ctk.CTkLabel(
            self.controls,
            text="Speed:"
        )

        self.speed_label.pack(
            side="left",
            padx=(20, 5)
        )


        # -------------------------------------------------
        # SPEED MENU
        # -------------------------------------------------

        self.speed_menu = ctk.CTkOptionMenu(
            self.controls,
            values=[
                "0.5×",
                "1×",
                "1.25×",
                "1.5×",
                "2×"
            ],
            width=90,
            command=self.change_speed
        )

        self.speed_menu.pack(
            side="left",
            padx=5
        )

        self.speed_menu.set("1×")


    # =====================================================
    # INITIALIZE VLC
    # =====================================================

    def initialize_vlc(self):

        try:

            self.instance = vlc.Instance(
                "--no-video-title-show"
            )

            self.player = (
                self.instance.media_player_new()
            )

        except Exception as error:

            self.show_error(
                "VLC tidak dapat dijalankan.\n\n"
                "Pastikan VLC Media Player sudah terinstall.\n\n"
                f"Error: {error}"
            )

            return


        # =================================================
        # LOAD MEDIA
        # =================================================

        try:

            media = self.instance.media_new(
                self.file_path
            )

            self.player.set_media(
                media
            )

        except Exception as error:

            self.show_error(
                f"Video tidak dapat dibuka.\n\n{error}"
            )

            return


        # =================================================
        # CONNECT VIDEO OUTPUT
        # =================================================

        self.parent.after(
            100,
            self.attach_video
        )


    # =====================================================
    # ATTACH VIDEO
    # =====================================================

    def attach_video(self):

        if self.player is None:
            return


        try:

            window_id = (
                self.video_placeholder.winfo_id()
            )


            if sys.platform.startswith("win"):

                self.player.set_hwnd(
                    window_id
                )

            elif sys.platform.startswith("linux"):

                self.player.set_xwindow(
                    window_id
                )

            elif sys.platform == "darwin":

                self.player.set_nsobject(
                    window_id
                )


            # Volume awal
            self.player.audio_set_volume(
                80
            )


            # Start playback
            self.play()


        except Exception as error:

            self.show_error(
                f"Video output gagal dibuat.\n\n{error}"
            )


    # =====================================================
    # PLAY
    # =====================================================

    def play(self):

        if self.player is None:
            return


        result = self.player.play()


        if result == -1:

            self.show_error(
                "Video gagal diputar."
            )

            return


        self.playing = True


        self.play_button.configure(
            text="❚❚ Pause"
        )


        # Apply current speed
        self.player.set_rate(
            self.playback_speed
        )


        self.start_update_loop()


    # =====================================================
    # TOGGLE PLAY / PAUSE
    # =====================================================

    def toggle_play(self):

        if self.player is None:
            return


        if self.playing:

            self.pause()

        else:

            self.play()


    # =====================================================
    # PAUSE
    # =====================================================

    def pause(self):

        if self.player is None:
            return


        self.player.pause()

        self.playing = False


        self.play_button.configure(
            text="▶ Play"
        )


    # =====================================================
    # STOP
    # =====================================================

    def stop(self):

        if self.player is None:
            return


        self.player.stop()

        self.playing = False


        self.play_button.configure(
            text="▶ Play"
        )


        # Reset timeline
        self.is_seeking = True

        self.timeline.set(0)

        self.is_seeking = False


        self.current_time_label.configure(
            text="00:00"
        )


        # VLC membutuhkan sedikit waktu setelah stop
        self.parent.after(
            100,
            self.prepare_after_stop
        )


    # =====================================================
    # PREPARE AFTER STOP
    # =====================================================

    def prepare_after_stop(self):

        if self.player is None:
            return


        try:

            self.player.set_time(
                0
            )

        except Exception:

            pass


    # =====================================================
    # TIMELINE
    # =====================================================

    def on_timeline_move(self, value):

        if self.is_seeking:
            return


        if self.player is None:
            return


        if self.duration <= 0:
            return


        position = float(
            value
        )


        # Convert seconds → milliseconds
        milliseconds = int(
            position * 1000
        )


        self.player.set_time(
            milliseconds
        )


        self.current_time_label.configure(
            text=self.format_time(
                position
            )
        )


    # =====================================================
    # VOLUME
    # =====================================================

    def change_volume(self, value):

        if self.player is None:
            return


        volume = int(
            float(value)
        )


        self.player.audio_set_volume(
            volume
        )


        if volume == 0:

            self.volume_label.configure(
                text="🔇"
            )

        elif volume < 40:

            self.volume_label.configure(
                text="🔈"
            )

        elif volume < 75:

            self.volume_label.configure(
                text="🔉"
            )

        else:

            self.volume_label.configure(
                text="🔊"
            )


    # =====================================================
    # SPEED
    # =====================================================

    def change_speed(self, value):

        speed_map = {
            "0.5×": 0.5,
            "1×": 1.0,
            "1.25×": 1.25,
            "1.5×": 1.5,
            "2×": 2.0
        }


        self.playback_speed = (
            speed_map.get(
                value,
                1.0
            )
        )


        if self.player is not None:

            self.player.set_rate(
                self.playback_speed
            )


    # =====================================================
    # UPDATE LOOP
    # =====================================================

    def start_update_loop(self):

        if self.after_id is not None:
            return


        self.update_position()


    def update_position(self):

        self.after_id = None


        if self.player is None:
            return


        # -------------------------------------------------
        # Duration
        # -------------------------------------------------

        length = self.player.get_length()


        if length > 0:

            self.duration = (
                length / 1000
            )


            self.duration_label.configure(
                text=self.format_time(
                    self.duration
                )
            )


            self.timeline.configure(
                from_=0,
                to=max(
                    self.duration,
                    1
                )
            )


        # -------------------------------------------------
        # Current position
        # -------------------------------------------------

        current_time = (
            self.player.get_time()
        )


        if current_time >= 0:

            current_seconds = (
                current_time / 1000
            )


            self.current_time_label.configure(
                text=self.format_time(
                    current_seconds
                )
            )


            # Jangan update slider ketika user
            # sedang melakukan seek
            if not self.is_seeking:

                self.is_seeking = True

                self.timeline.set(
                    current_seconds
                )

                self.is_seeking = False


        # -------------------------------------------------
        # Detect end
        # -------------------------------------------------

        if self.player.get_state() == vlc.State.Ended:

            self.playing = False

            self.play_button.configure(
                text="▶ Play"
            )

            self.is_seeking = True

            self.timeline.set(
                self.duration
            )

            self.is_seeking = False

            return


        # -------------------------------------------------
        # Continue update
        # -------------------------------------------------

        self.after_id = self.parent.after(
            100,
            self.update_position
        )


    # =====================================================
    # ERROR
    # =====================================================

    def show_error(self, message):

        error_label = ctk.CTkLabel(
            self.container,
            text=message,
            font=ctk.CTkFont(
                size=14
            ),
            text_color="#DC2626"
        )


        error_label.place(
            relx=0.5,
            rely=0.5,
            anchor="center"
        )


    # =====================================================
    # FORMAT TIME
    # =====================================================

    @staticmethod
    def format_time(seconds):

        seconds = int(
            max(
                0,
                seconds
            )
        )


        hours = (
            seconds // 3600
        )


        minutes = (
            seconds % 3600
        ) // 60


        seconds = (
            seconds % 60
        )


        if hours > 0:

            return (
                f"{hours:02d}:"
                f"{minutes:02d}:"
                f"{seconds:02d}"
            )


        return (
            f"{minutes:02d}:"
            f"{seconds:02d}"
        )


    # =====================================================
    # CLEANUP
    # =====================================================

    def destroy(self):

        # Stop update loop
        if self.after_id is not None:

            try:

                self.parent.after_cancel(
                    self.after_id
                )

            except Exception:

                pass

            self.after_id = None


        # Stop VLC
        if self.player is not None:

            try:

                self.player.stop()

            except Exception:

                pass


            try:

                self.player.release()

            except Exception:

                pass


            self.player = None


        # Release VLC instance
        if self.instance is not None:

            try:

                self.instance.release()

            except Exception:

                pass


            self.instance = None


        # Destroy UI
        if self.container.winfo_exists():

            self.container.destroy()