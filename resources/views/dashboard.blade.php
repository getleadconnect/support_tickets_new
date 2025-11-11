<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Support Tickets - Dashboard</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="app-url" content="{{ config('app.url') }}">
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
    <link rel="alternate icon" href="{{ asset('favicon.ico') }}">

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

    <!-- Wait for jQuery to load -->
    <script>
        window.jQuery = window.$ = jQuery;
    </script>

    <!-- Country Code Picker CSS -->
    <link rel="stylesheet" href="{{ asset('css/ccpicker/ccpicker.css') }}">

    <!-- Country Code Picker JS -->
    <script src="{{ asset('js/ccpicker/ccpicker.js') }}"></script>

    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="antialiased">
    <div id="app"></div>
</body>
</html>